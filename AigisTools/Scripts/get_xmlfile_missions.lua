
local xmldoc = require("lib/xmldoc")
local xml = require("lib/xml")

local text = xmldoc.getfile(nil, "missions")
local obj = xml.parse(text)

local da = obj.contents
local count = #da[1].contents
local missions = {}

print("[")
for i = 1, count do
  print("	{")
  for _, elt in ipairs(da) do
    local num = tonumber(elt.contents[i].contents)
	if num == nil then num = "nil" end
    print('		"' .. elt.tag .. '": ' .. num .. ',')
  end
  print("	},")
end
print("]")