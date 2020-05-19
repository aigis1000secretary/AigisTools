-- parse_speed.lua
-- v1.0
-- author: lzlis

local xml = require("lib/xml")
local xmldoc = require("lib/xmldoc")
local parse_al = require("lib/parse_al")
local dl = require("lib/download")

local units = xmldoc.getfile(nil, "cards")
units = xml.parse(units)
units = xml.totable(units)

local dots = {}

local mode
if dl.listhasfile(nil, "PlayerDot0.aar") then
  mode = "level"
  for i = 0, 2 do
    local anims = {}
    local playerdots = dl.getfile(nil, string.format("PlayerDot%d.aar", i))
    playerdots = parse_al.parse(playerdots)
    for _, f in ipairs(playerdots) do
      if f.name:match("%.aod$") then
        local aod = f.value
        local pattern = aod.mt and aod.mt.pattern
        --[[
        if f.name == "Atk2.aod" then
          print(string.format("%x", pattern))
        end
        --]]
        if pattern then
          anims[pattern] = aod
        end
      end
    end
    dots[i] = anims
  end
else
  mode = "card"
  for i = 0, 9999 do
    local aarname = string.format("PlayerDot%04d.aar", i)
    if dl.listhasfile(nil, aarname) then
      local anims = {}
      local playerdot = dl.getfile(nil, aarname)
      playerdot = parse_al.parse(playerdot)
      for _, f in ipairs(playerdot) do
        if f.name:match("%.aod$") then
          local aod = f.value
          local pattern = aod.mt and aod.mt.pattern
          if pattern then
            anims[pattern] = aod
          end
        end
      end
      dots[i] = anims
      --print("found", i, anims)
    end
  end
end
assert(mode)

local nametext = dl.getfile(nil, "NameText.atb")
nametext = parse_al.parse(nametext)
for i, t in ipairs(nametext) do
  local unit = units[i]
  if unit then
    unit._name = t[1].v
  end
end

-- classes

local arch = dl.getfile(nil, "PlayerUnitTable.aar")
arch = parse_al.parse(arch)
local classtable = nil
for _, archfile in ipairs(arch) do
  if archfile.name == "ClassData.atb" then
    classtable = archfile.value
    break
  end
end
assert(classtable)
classtable = parse_al.totable(classtable)
local classes = {}

for _, class in ipairs(classtable) do
  classes[class.ClassID] = class
end

-- output

local kAtk1 = 3
local kAtk2 = math.huge --7
local kAtk3 = 8

local kPatternBase = 0x35000

for _, unit in ipairs(units) do
  --print("N",_)
  if unit._name ~= "-" and unit._name ~= nil then
    local classID = unit.InitClassID
    local cardID = unit.CardID
    local pattern = {
      (kPatternBase + cardID) << 4,
      (kPatternBase + 10000 + cardID) << 4,
      (kPatternBase + 20000 + cardID) << 4,
      (kPatternBase + 30000 + cardID) << 4,
      (kPatternBase + 40000 + cardID) << 4,
    }
    local dotID_override = {}
    for i = 0, 4 do
      local k = "DotID" .. i
      if unit[k] and unit[k] ~= 0 then
        dotID_override[i] = unit[k]
      end
    end
    
    local fringe = {assert(classes[classID])}
    local my_classes = {}
    while #fringe > 0 do
      local class = fringe[1]
      table.remove(fringe, 1)
      table.insert(my_classes, class)
      if class.JobChange then
        table.insert(fringe, classes[class.JobChange])
      end
      if class.AwakeType1 then
        table.insert(fringe, classes[class.AwakeType1])
      end
      if class.AwakeType2 then
        table.insert(fringe, classes[class.AwakeType2])
      end
    end
    
    --local class = assert(classes[classID])
    --print(unit._name, cardID, classID, pattern, class)
    for _, class in ipairs(my_classes) do
      local patternidx = 1 + class.DotNo
      for map_idx, offset in ipairs{kAtk1, kAtk2, kAtk3} do
        local aod
        if mode == "level" then
          aod = dots[class.DotNo][pattern[patternidx] + offset]
        elseif mode == "card" then
          local override = dotID_override[class.DotNo]
          local override_full = nil
          if override then
            cardID = override % 10000
            override_full = (kPatternBase + override) << 4
          end
          local dot = dots[cardID]
          if dot then
            aod = dot[override_full or (pattern[patternidx] + offset)]
          end
        else
          error()
        end
        --print(patternidx)
        --print(unit._name, string.format("%x", pattern[patternidx] + offset))
        if aod then
          local attack_length = aod.mt.length
          local attack_frame = class.AttackAnimNo
          if map_idx > 1 then
            print(cardID, unit._name, class.Name, "alt" .. offset)
          else
            print(cardID, unit._name, class.Name)
          end
          print(class.AttackWait + attack_length + 2, "=", attack_length .. " + " .. class.AttackWait)
          
          local attack_time
          if aod.mt.entries[1] and aod.mt.entries[1].data.PatternNo[1 + attack_frame] then
            attack_time = aod.mt.entries[1].data.PatternNo[1 + attack_frame].time -- +1 is Lua-indexing offset
          else
            attack_time = "oob (" .. attack_frame .. ")"
          end
          print("Initial:", attack_time)
          
          local timing_str = tostring(aod.mt.entries[1].data.PatternNo[1].time)
          for i = 2, #aod.mt.entries[1].data.PatternNo do
            timing_str = timing_str .. " / " .. aod.mt.entries[1].data.PatternNo[i].time
          end
          print("Timing:", timing_str)
          print()
            
        end
      end
      
    end
  end
end
