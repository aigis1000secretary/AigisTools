local dl = require("lib/download")
local parse_al = require("lib/parse_al")

local missiles = dl.getfile(nil, "Missile.atb")
missiles = parse_al.parse(missiles)
missiles = parse_al.totable(missiles)

local group_rows = dl.getfile(nil, "GroupConfig.atb")
group_rows = parse_al.parse(group_rows)
group_rows = parse_al.totable(group_rows)

local deflectable = {}
for _, row in ipairs(group_rows) do
  local id = row.MissileID_Reflection
  if id ~= 0 then
    deflectable[id - 1] = true
  end
end

local function parse(id)
  local out = ""
  local missile = missiles[id + 1]
  out = out .. "Missile ID: " .. id .. " (" .. (missile.Enemy ~= 0 and "enemy" or "ally") .. ")\n"
  out = out .. "Speed: " .. missile.Speed .. "\n"
  out = out .. "Offset: " .. missile.XOffset .. ", " .. missile.YOffset .. "; MaxDim: " .. missile.MaxWidth .. ", " .. missile.MaxHeight .. "\n"
  if missile.DamageArea ~= 0 then
    out = out .. "Splash: " .. math.floor(missile.DamageArea * 4 / 3 + .5) .. " (" .. missile.DamageArea .. " * 4/3)\n"
  end
  if missile.SlowTime ~= 0 or missile.SlowRate ~= 0 then
    out = out .. "Slow: " .. missile.SlowRate .. "% for " .. missile.SlowTime .. " frames\n"
  end
  out = out .. "Deflect: " .. (deflectable[id] and "yes" or "no") .. "\n"
  return out
end

return {
  parse = parse,
}
