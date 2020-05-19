-- parse_unitstats.lua
-- v2.0
-- author: lzlis

local unit = require("lib/unit")

for id = 1, unit.get_count() do
  if unit.has_name(id) then
    local info = unit.get_info(id, {"class"})
    for _, class in ipairs(info.classes) do
      local cc = class.DotNo
      local levels = unit.get_interesting_levels(id, class)
      local hp = {}
      local atk = {}
      local def = {}
      for index, level in ipairs(levels) do
        local stats = unit.get_stats(id, cc, level)
        if stats then
          table.insert(hp, stats.hp .. stats.hpa)
          table.insert(atk, stats.atk .. stats.atka)
          table.insert(def, stats.def .. stats.defa)
        end
      end
      if #hp > 0 then
        print(unit.get_name(id), class.Name)
        print("Level", table.concat(levels, "\t"))
        print("HP", table.concat(hp, "\t"))
        print("ATK", table.concat(atk, "\t"))
        print("DEF", table.concat(def, "\t"))
        print()
      end
    end
  end
end
