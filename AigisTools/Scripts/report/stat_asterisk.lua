local unit = require("lib/unit")

for id = 1, 9999 do
  if unit.exists(id) then
    for cc = 0, 4 do
      for level = 1, 99 do
        local stats = unit.get_stats(id, cc, level)
        if stats then
          if stats.hpa ~= "" or stats.defa ~= "" or stats.atka ~= "" then
            local function f(a, b, c)
              return a .. b .. (c or "")
            end
            print(unit.get_name(id), cc, level,
              f(stats.hp, stats.hpa, stats.hpb),
              f(stats.atk, stats.atka, stats.atkb),
              f(stats.def, stats.defa, stats.defb)
            )
          end
        end
      end
    end
  end
end