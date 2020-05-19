-- mission_map.lua
-- v1.0
-- author: lzlis

local dl = require("lib/download")
local xmldoc = require("lib/xmldoc")
local xml = require("lib/xml")
local parse_al = require("lib/parse_al")
local fs = require("lib/file")
local gm = require("lib/gm")

--local mission_id, remap, remap_alert = ...
local mission_id, opt = ...
local remap, remap_alert


local route_id_mode = opt == "route"
local skip_dot_mode = opt == "nodot"
mission_id = assert(tonumber(mission_id))
local add_route = {}
local alert_off = nil
local alert_fix = nil
local skip_remap = ""
local yfix = {}
local xfix = {}
local ally

local parsing = false
for l in io.lines("Data\\meta\\map.txt") do
  local n = l:match("%[(%d+)%]")
  if n then
    parsing = tonumber(n) == mission_id
  end
  if parsing then
    local k, v = l:match("([%+%-%w]+)%=([%w%, %-]+)")
    if k == "remap" then remap = v end
    if k == "skip" then skip_remap = v end
    if k == "alert" then remap_alert = v end
    if k == "+route" then
      for n in v:gmatch("%d+") do
        n = tonumber(n)
        if n then
          --print("add route", n)
          add_route[n] = true
        end
      end
    end
    if k == "alert+y" then
      local i = 1
      for n in v:gmatch("%-?%d+") do
        n = tonumber(n)
        if n then
          yfix[i] = n
        end
        i = i + 1
      end
    end
    if k == "alert+x" then
      local i = 1
      for n in v:gmatch("%-?%d+") do
        n = tonumber(n)
        if n then
          xfix[i] = n
        end
        i = i + 1
      end
    end
    if k == "alertoff" then alert_off = v end
    if k == "alertfix" then alert_fix = v end
    if k == "ally" then ally = v end
  end
end

local working = "working\\"
local out = "out\\missions\\"

local text = xmldoc.getfile(nil, "missions")
local missions = xml.parse(text)
missions = xml.totable(missions)

text = dl.getfile(nil, "QuestNameText.atb")
local nametext = parse_al.parse(text)

for _, mission in ipairs(missions) do
  local titleid = mission.QuestTitle
  mission._name = nametext[titleid + 1] and tostring(nametext[titleid + 1][1].v) or "(unknown)"
  if mission._name == nil then
    mission._name = "(nil)"
  elseif #mission._name == 0 then
    mission._name = "(none)"
  end
end

local mission = nil
for _, mission_candidate in ipairs(missions) do
  if mission_candidate.QuestID == mission_id then
    mission = mission_candidate
    break
  end
end
assert(mission, "Cannot find mission!")

if not fs.dir_exists(out) then
  fs.make_dir(out)
end
if not fs.dir_exists(working) then
  fs.make_dir(working)
end

--out = out .. mission._name:gsub(" ", "_"):gsub("%p", "_") .. ".png"
out = out .. string.format("%04d", mission_id)
if route_id_mode then
  out = out .. "_r"
end
out = out .. ".png"

local mapn = mission.MapNo
local entryn = mission.EntryNo
print("MapNo", mapn)
print("EntryNo", entryn)
local mapname = string.format("Map%03d", mapn)
local entryname = string.format("Entry%02d.atb", entryn)
local locname = string.format("Location%02d.atb", mission.LocationNo)

local png = dl.getfile(nil, mapname .. ".png")

local h = assert(io.open(out, 'wb'))
assert(h:write(png))
assert(h:close())

local maparch = dl.getfile(nil, mapname .. ".aar")
maparch = parse_al.parse(maparch)

local entry = nil
local location = nil
local routes = {}
for _, archfile in ipairs(maparch) do
  if archfile.name == entryname then
    entry = archfile.value
  elseif archfile.name == locname then
    location = archfile.value
  end
  local routen = archfile.name:match("Route(%d%d)%.atb")
  if routen then
    routes[routen] = parse_al.totable(archfile.value)
  end
end

assert(entry, string.format("Cannot find entry file %s!", entryname))
assert(location)
entry = parse_al.totable(entry)
location = parse_al.totable(location)

local width = 960
local height = 640
local function draw_string(text, color, x, y)
  local scale = #text
  local inv_scale = 1 / scale
  local bat = working .. "temp.bat"
  local commands = working .. "temp.gm.txt"
  local h = assert(io.open(bat, 'w'))
  assert(h:write(string.format("@%s batch \"" .. commands .. "\"\n", gm.path)))
  assert(h:close())
  local h = assert(io.open(commands, 'w'))
  -- originally used pointsize 60 -stroke black -strokewidth 2
  assert(h:write(string.format([[
mogrify -fill "%s" -font Helvetica-Bold -pointsize 46 -draw "gravity center scale %f, %f text %d, %d '%s'" %s
]], "#000", inv_scale, 1, scale * (x - width / 2 - 1), y - height / 2, text, out)))
  assert(h:write(string.format([[
mogrify -fill "%s" -font Helvetica-Bold -pointsize 46 -draw "gravity center scale %f, %f text %d, %d '%s'" %s
]], "#000", inv_scale, 1, scale * (x - width / 2 + 1), y - height / 2, text, out)))
  assert(h:write(string.format([[
mogrify -fill "%s" -font Helvetica-Bold -pointsize 46 -draw "gravity center scale %f, %f text %d, %d '%s'" %s
]], "#000", inv_scale, 1, scale * (x - width / 2), y - height / 2 - 1, text, out)))
  assert(h:write(string.format([[
mogrify -fill "%s" -font Helvetica-Bold -pointsize 46 -draw "gravity center scale %f, %f text %d, %d '%s'" %s
]], "#000", inv_scale, 1, scale * (x - width / 2), y - height / 2 + 1, text, out)))
  assert(h:write(string.format([[
mogrify -fill "%s" -font Helvetica-Bold -pointsize 46 -draw "gravity center scale %f, %f text %d, %d '%s'" %s
]], color, inv_scale, 1, scale * (x - width / 2), y - height / 2, text, out)))
  assert(h:close())
  --print(bat)
  assert(os.execute(bat))
end

local battle_art = dl.getfile(nil, "Battle.aar")
battle_art = parse_al.parse(battle_art)
local battle_tx = nil
for _, archfile in ipairs(battle_art) do
  if archfile.name == "Battle.atx" then
    battle_tx = archfile.value
    break
  end
end

assert(battle_tx)

local alert = battle_tx.sprites[19][1]
local heart = battle_tx.sprites[30][1]

local function convert(frame, name, alpha, tx, flip)
  alpha = alpha or 1.0
  local obj = tx or battle_tx
  local image = ""
  local i = frame.y * obj.rawimage.width + frame.x
  for _ = 1, frame.height do
    image = image .. obj.rawimage.image:sub(1 + 4 * i, 1 + 4 * (i + frame.width) - 1)
    i = i + obj.rawimage.width
  end
  if alpha < 1.0 then
    image = image:gsub("(...)(.)", function(s, c)
      return s..string.char(math.floor(string.byte(c) * alpha + .5))
    end)
  end
  
  local out_raw = assert(io.open(working .. name, 'wb'))
  assert(out_raw:write(image))
  assert(out_raw:close())
  
  if flip then
    local bat = working .. "temp.bat"
    local h = assert(io.open(bat, 'w'))
    assert(h:write(string.format([[
    @%s mogrify -flop rgba:%s[%dx%d] -format rgba
    ]], gm.path, working .. name, frame.width, frame.height)))
    assert(h:close())
    assert(os.execute(bat))
  end
  
  print(name, frame.width, frame.height, frame.width * frame.height * 4, #image)
  return {name = name, x = frame.width, y = frame.height, xoff = frame.origin_x, yoff = frame.origin_y}
end

local function convert2(frame, name, alpha, color)
  alpha = alpha or 1.0
  local obj = battle_tx
  local image = ""
  local i = frame.y * obj.rawimage.width + frame.x
  for _ = 1, frame.height do
    image = image .. obj.rawimage.image:sub(1 + 4 * i, 1 + 4 * (i + frame.width) - 1)
    i = i + obj.rawimage.width
  end
  image = image:gsub("(.)(.)(.)(.)", function(r, g, b, a)
    local r1, g1, b1 = r:byte(), g:byte(), b:byte()
    local rf = r1 / 255
    r1 = math.floor(rf * color.r + 0.5)
    g1 = math.floor(rf * color.g + 0.5)
    b1 = math.floor(rf * color.b + 0.5)
    return string.char(r1, g1, b1) .. a
  end)
  if alpha < 1.0 then
    image = image:gsub("(...)(.)", function(s, c)
      return s..string.char(math.floor(string.byte(c) * alpha + .5))
    end)
  end
  
  local out_raw = assert(io.open(working .. name, 'wb'))
  assert(out_raw:write(image))
  assert(out_raw:close())
  
  print(name, frame.width, frame.height, frame.width * frame.height * 4, #image)
  return {name = name, x = frame.width, y = frame.height, xoff = frame.origin_x, yoff = frame.origin_y}
end

local melee_rgb = {r = 255, g = 255, b = 0}
local ranged_rgb = {r = 255, g = 153, b = 0}
local special_rgb = {r = 15, g = 255, b = 255}

local alert_melee = convert2(alert, "alert_melee.raw", 1.0, melee_rgb)
local alert_ranged = convert2(alert, "alert_ranged.raw", 1.0, ranged_rgb)
local alert_special = convert2(alert, "alert_special.raw", 1.0, special_rgb)
heart = convert(heart, "heart.raw")
heart.name = "..\\Data\\meta\\map_heart.png"

local function draw_img(img, x, y, scale, flip)
  scale = scale or 1
  local bat = working .. "temp.bat"
  local h = assert(io.open(bat, 'w'))
  local xf, yf = 0, 0
  if scale ~= 1 then
    xf = math.floor(img.x * scale + .5)
    yf = math.floor(img.y * scale + .5)
    
  end
  assert(h:write(string.format([[
  @%s mogrify -draw "image Over %d,%d %d,%d rgba:%s[%dx%d]" %s
  ]], gm.path, x - math.floor(img.xoff * scale + .5), y - math.floor(img.yoff * scale + .5), xf, yf, working .. img.name, img.x, img.y, out)))
  assert(h:close())
  --print(bat)
  assert(os.execute(bat))
end

for _, spot in ipairs(location) do
  if spot.ObjectID // 100 == 0 then
    draw_img(heart, spot.X, spot.Y)
  end
end

local effects = nil
local effect_tx = nil
local fire = nil
local gate = nil
local gate_flip = nil
for _, spot in ipairs(location) do
  if spot.ObjectID >= 1000 and spot.ObjectID <= 1099 then
    if effects == nil then
      effects = dl.getfile(nil, "Effect.aar")
      effects = parse_al.parse(effects)
      for _, archfile in ipairs(effects) do
        if archfile.name == "Effect.atx" then
          effect_tx = archfile.value
          break
        end
      end
      assert(effect_tx)
    end
    if spot.ObjectID == 1000 then
      if fire == nil then
        fire = convert(effect_tx.sprites[15][1], "fire.rgba", nil, effect_tx)
      end
      draw_img(fire, spot.X, spot.Y, 2)
    end
    if spot.ObjectID == 1001 then
      if gate == nil then
        gate = convert(effect_tx.sprites[26][1], "gate.rgba", nil, effect_tx)
      end
      draw_img(gate, spot.X, spot.Y, 1)
    end
    if spot.ObjectID == 1002 then
      if gate_flip == nil then
        gate_flip = convert(effect_tx.sprites[26][1], "gate_flip.rgba", nil, effect_tx, true)
      end
      draw_img(gate_flip, spot.X, spot.Y, 1)
    end
  end
end

local alert_routes = {}
for _, ent in ipairs(entry) do
  local n = ent.RouteNo
  --print("route", n)
  if ent.EnemyID == 2000 then
    alert_routes[n] = true
  elseif route_id_mode and 
    (ent.EnemyID >= 1 and ent.EnemyID <= 999
    or ent.EnemyID >= 6000 and ent.EnemyID <= 7999) then
    alert_routes[n] = true
  end
end

for n, _ in pairs(add_route) do
  alert_routes[n] = true
end

local route_list = {}
for routen, _ in pairs(alert_routes) do
  table.insert(route_list, routen)
end

table.sort(route_list)

for i, routen in pairs(route_list) do
  print(routen)
  local routeid = string.format("%02d", routen)
  local route = assert(routes[routeid])
  
  local rt_idx = 1
  if alert_off then
    local off = alert_off:sub(i, i)
    print("alert_off", i, off, alert_off)
    rt_idx = rt_idx + (tonumber(off) or 0)
  end
  local fix = false
  if alert_fix then
    fix = alert_fix:sub(i, i) == 'y'
  end
  
  local x, y = route[rt_idx]["@X"], route[rt_idx]["@Y"]
  
  local margin = 40
  local oob = x < margin or y < margin or x > width - margin or y > height - margin
  if fix and oob then
    local x1, y1 = route[rt_idx + 1]["@X"], route[rt_idx + 1]["@Y"]
    local t1 = 0
    local t2 = 0
    print(x, y, x1, y1)
    if x < margin and x1 >= margin then
      --x + (x1 - x) * t = margin
      t1 = (margin - x) / (x1 - x)
    elseif x > width - margin and x1 <= width - margin then
      --x + (x1 - x) * t = width - margin
      t1 = (width - margin - x) / (x1 - x)
    end
    if y < margin and y1 >= margin then
      t2 = (margin - y) / (y1 - y)
    elseif y > height - margin and y1 <= height - margin then
      t2 = (height - margin - y) / (y1 - y)
    end
    local t = math.max(t1, t2)
    print("fix", t)
    if t < 0 then t = 0 end
    if t > 1 then t = 1 end
    x = math.floor(x + (x1 - x) * t + .5)
    y = math.floor(y + (y1 - y) * t + .5)
    print("fixout", x, y)
  end
  
  local img = nil -- alert_melee
  local skip = false
  local img_key = remap_alert and remap_alert:sub(i, i)
  if img_key == "1" then
    img = alert_melee
  elseif img_key == "2" then
    img = alert_ranged
  elseif img_key == "3" then
    img = alert_special
  elseif img_key == "-" then
    skip = true
  end
  
  local infix = 10
  local w = alert_melee.x
  
  local adjust = (yfix[i] or 0) ~= 0 or (xfix[i] or 0) ~= 0
  if adjust then
    print(x,y)
  end
  y = y + (yfix[i] or 0)
  x = x + (xfix[i] or 0)
  if adjust then
    print("->",x,y)
  end
  
  if route_id_mode then
    draw_string(routeid, "#ff0", x, y)
  elseif skip then
    -- nothing
  elseif img then
    draw_img(img, x, y)
  elseif img_key == "L" then
    draw_img(alert_melee, math.floor(x - (infix + w) / 2 + .5), y)
    draw_img(alert_ranged, math.floor(x + (infix + w) / 2 + .5), y)
  elseif img_key == "l" then
    draw_img(alert_special, math.floor(x - (infix + w) / 2 + .5), y)
    draw_img(alert_ranged, math.floor(x + (infix + w) / 2 + .5), y)
  else
    --draw_string(routeid, "#ff0", x, y)
    draw_string(tostring(i), "#ff0", x, y)
  end
end

if skip_dot_mode then return end

local byte_A = string.byte("A")
local byte_Z = string.byte("Z")
local byte_a = string.byte("a")
local byte_z = string.byte("z")
if remap then
  local t = {}
  local i = 1
  for a in remap:gmatch(".") do
    a = string.byte(a)
    if a >= byte_A and a <= byte_Z then
      t[a - byte_A + 1] = i
    elseif a >= byte_a and a <= byte_z then
      t[a - byte_a + 27] = i
    end
    i = i + 1
  end
  remap = t
end
if skip_remap then
  local t = {}
  for a in skip_remap:gmatch(".") do
    a = string.byte(a)
    if a >= byte_A and a <= byte_Z then
      t[a - byte_A + 1] = true
    elseif a >= byte_a and a <= byte_z then
      t[a - byte_a + 27] = true
    end
  end
  skip_remap = t
end

local index = 1
for _, spot in ipairs(location) do
  local color
  if spot.ObjectID // 100 == 2 then
    color = "#ff0"
  elseif spot.ObjectID // 100 == 3 then
    color = "#f90"
  end
  local letter = index
  local ally_pattern
  if letter <= 26 then
    ally_pattern = string.char(byte_A + letter - 1)
  else
    ally_pattern = string.char(byte_a + letter - 27)
  end
  
  if color and ally and ally:match(ally_pattern) then
    color = "#6e4"
  end
  
  if color then
    if skip_remap == nil or not skip_remap[index] then
      if remap then
        letter = assert(remap[letter], "failed to remap " .. tostring(letter))
      end
      local text
      --print(letter)
      if letter <= 26 then
        text = string.char(byte_A + letter - 1)
      else
        text = string.char(byte_A + letter - 27)
        text = text .. text
      end
      --print(nil, text)
      draw_string(text, color, spot.X, spot.Y)
    else
      print("skipped", index)
    end
    index = index + 1
  end
end

print(out)
