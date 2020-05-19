local unit = require("lib/unit")

local out = "out/cards/"
local working = "working/"

local id, mode = ...
id = assert(tonumber(id))

if mode == "text" then
  print(unit.parse(id))
else
  unit.dump(id, out, working)
end
