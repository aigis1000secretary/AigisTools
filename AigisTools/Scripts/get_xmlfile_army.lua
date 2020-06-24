
local xmldoc = require("lib/xmldoc")
local xml = require("lib/xml")

local text = xmldoc.getfile(nil, "oS5aZ5ll")
local obj = xml.parse(text)

local key_map = {
  ["A1"] = "CardID",
  ["A2"] = "ClassID",
  ["A4"] = "Experience",
}

--print(text)
local da = obj.contents
local count = #da[1].contents

print("[")
for i = 1, count do
  print("	{")
  for _, elt in ipairs(da) do
    local num = tonumber(elt.contents[i].contents)
	if num == nil then num = "nil" end
	key = key_map[elt.tag] or elt.tag
    print('		"' .. key .. '": ' .. num .. ',')
  end
  print("	},")
end
print("]")
