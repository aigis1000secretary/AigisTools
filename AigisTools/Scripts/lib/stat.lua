local function round(x)
  --return x
  return math.floor(x + .5)
end

local function round2(x)
  return math.ceil(x - .5)
end

local function round3(x)
  return math.floor(x + .5 + 1/2^48)
end

-- accurate lerp
local function lerp(num, den, a, b)
  local x = a * (den - num) + b * num
  return x / den
end

local function flerp(num, den, a, b)
  local t = num / den
  return (1 - t) * a + t * b
end

local function flerp2(num, den, a, b)
  local t = num / den
  return a + (b - a) * t
end

local function scale(value, pct)
  local x = value * pct
  return x / 100
end

local function fscale(value, pct)
  local mod = pct / 100
  return value * mod
end

local function stat(level, maxlevel, mod, s0, s1)
  -- correct: round, fscale, lerp
  local l = lerp(level, maxlevel, s0, s1)
  local l2 = flerp(level, maxlevel, s0, s1)
  local l3 = flerp2(level, maxlevel, s0, s1) -- not tested
  --assert(l == l2)
  --assert(l == l3)
  local stat1 = round(fscale(round(l), mod))
  local stat2 = round(scale(round(l), mod))
  local stat3 = round3(fscale(round(l), mod))
  local stat4 = round(fscale(round(l2), mod))
  local stat5 = round(fscale(round(l3), mod))
  --if stat1 ~= stat5 or stat1 ~= stat5 then
  --  return stat1, "***", "(" .. stat4 .. "," .. stat5 .. ")"
  if stat1 == stat2 then
    return stat1, ""
  --elseif stat1 == stat3 then
    --return stat1, "*"--, stat2
  else
    return stat1, "*"--, stat3 .. "(" .. stat2 .. ")"
  end
  --return round(round(((1 - t) * s0 + t * s1)) * (mod/100))
end

return {
  get = stat,
}
