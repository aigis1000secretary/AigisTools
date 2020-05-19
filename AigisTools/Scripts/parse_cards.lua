-- parse_cards.lua
-- v1.0
-- author: lzlis

local dl = require("lib/download")
local xml = require("lib/xml")
local xmldoc = require("lib/xmldoc")
local parse_al = require("lib/parse_al")

local text = xmldoc.getfile(nil, "cards")
local obj = xml.parse(text)

local da = obj.contents

local count = #da[1].contents

local units = {}

local nums = {}

for i = 1, count do
  local unit = {}
  for _, elt in ipairs(da) do
    unit[elt.tag] = tonumber(elt.contents[i].contents)
  end
  units[#units + 1] = unit
end

local units_by_cardid = {}
for _, unit in ipairs(units) do
  units_by_cardid[unit.CardID] = unit
end

text = dl.getfile(nil, "NameText.atb")
local nametext = parse_al.parse(text)

for i, t in ipairs(nametext) do
  local unit = units_by_cardid[i]
  if unit then
    unit._name = t[1].v
  end
end

local fields = {}
table.insert(fields, "_name")

local skip = {
  ["FreePrize"] = true,
  ["RarePrize"] = true,
  ["PremiumPrize"] = true,
  ["PremiumPrize2"] = true,
  ["TicketPrize"] = true,
}

for _, elt in ipairs(da) do
  if skip[elt.tag] == nil then
    table.insert(fields, elt.tag)
  end
end

-- output

local function pad(s, n)
  return s .. (" "):rep(n - #s)
end

local widths = {}
for i, field in ipairs(fields) do
  widths[i] = #field
end

for _, unit in ipairs(units) do
  for i, field in ipairs(fields) do
    widths[i] = math.max(widths[i], #tostring(unit[field]))
  end
end

for i, field in ipairs(fields) do
  io.write(pad(field, widths[i]), " ")
end
io.write("\n")

for _, unit in ipairs(units) do
  for i, field in ipairs(fields) do
    io.write(pad(tostring(unit[field]), widths[i]), " ")
  end
  io.write("\n")
end

-- [[
for _, unit in ipairs(units) do
  local str = (unit._name or "(no name)") .. " " .. unit.Rare .. " "
  local count = 0
  for _, which in ipairs{"FreePrize", "TicketPrize", "RarePrize", "PremiumPrize", "PremiumPrize2"} do
    if unit[which] and unit[which] > 0 then
      str = str .. which .. " "
      count = count + 1
    end
  end
  if count > 0 --[[and unit.Rare >= 2]] then
    print(str)
  end
end
print()

local function similar(x, y)
  if x > y then x, y = y, x end
  return x / y > .999
end

local prize_idx = {FreePrize = 1, TicketPrize = 2, RarePrize = 3, PremiumPrize = 4, PremiumPrize2 = 5}
local totals = {}
local boost = {}
local base = {}
for k, v in pairs(prize_idx) do 
  totals[v] = {}
  boost[v] = {}
  for r = 0, 10 do
    totals[v][r] = 0.0
    boost[v][r] = {}
  end
end

if units[1] and units[1].FreePrize then

  for _, card in ipairs(units) do
    local r = card.Rare
    for k, v in pairs(prize_idx) do
      local num = card[k]
      totals[v][r] = (totals[v][r] or 0.0) + num
      local els = true
      for k2, v2 in pairs(boost[v][r]) do
        if similar(k2, num) then
          els = false
          table.insert(v2, card._name)
          break
        end
      end
      if els then
        boost[v][r][num] = {card._name}
      end
    end
  end

  local reversed = {}
  for k, v in pairs(prize_idx) do
    reversed[v] = k
  end
  for v, k in ipairs(reversed) do
    print(k)
    for r = 0, 10 do
      if totals[v][r] and totals[v][r] > 0.0 then
        print(r, totals[v][r])
      end
    end
    print()
    print("boost")
    for r = 0, 10 do
      for k2, v2 in pairs(boost[v][r]) do
        if next(v2) then
          print(r, k2, table.concat(v2, ", "))
        end
      end
    end
    print()
  end
end

--]]