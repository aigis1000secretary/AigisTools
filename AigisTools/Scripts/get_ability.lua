local ability = require("lib/ability")
local class = require("lib/class")

local id, second = ...

if id == "class" then
  local class_id = assert(tonumber(second))
  local cl = class.get(class_id)
  if cl then
    if cl.ClassAbility1 ~= 0 then
      print("(Deprecated?) Ability Power: " .. cl.ClassAbilityPower1)
      print("Description: " .. cl.Explanation:gsub("\n(.)", "\t\n%1"))
      print(ability.parse_config(cl.ClassAbility1))
    else
      print("No class ability")
    end
  else
    print("Class cannot be found!")
  end
else
  local ids = {assert(tonumber(id))}
  for index, id in ipairs(ids) do
    print(ability.parse(id))
    if index < #ids then print() end
  end
end

