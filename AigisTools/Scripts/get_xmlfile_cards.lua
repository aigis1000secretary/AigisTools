
local xmldoc = require("lib/xmldoc")
local xml = require("lib/xml")

local text = xmldoc.getfile(nil, "cards")
local obj = xml.parse(text)

local da = obj.contents
local count = #da[1].contents

print("[")
for i = 1, count do
  print("	{")
  for _, elt in ipairs(da) do
    local num = tonumber(elt.contents[i].contents)
	if num == nil then num = 'null' end
    print('		"' .. elt.tag .. '": ' .. num .. ',')
  end
  print("	},")
end
print("]")
