local skill = require("lib/skill")

local id, second = ...

local ids
if id == "influence" then
  ids = skill.find_influence(assert(tonumber(second)))
else
  ids = {assert(tonumber(id))}
end

for index, id in ipairs(ids) do
  print(skill.parse(id))
  if index < #ids then print() end
end
