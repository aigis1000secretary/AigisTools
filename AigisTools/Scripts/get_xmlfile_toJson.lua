
local xmldoc = require("lib/xmldoc")
local xml = require("lib/xml")

local fname = ...

local text = xmldoc.getfile(nil, fname)
local obj = xml.parse(text)

--print(text)
local da = obj.contents
local count = #da[1].contents

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
