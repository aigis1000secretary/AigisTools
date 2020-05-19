-- scale_image.lua
-- v1.2
-- author: lzlis
-- usage: lua.exe scale_image.lua [input_file(png)] [scale]
-- note: this uses "working" folder and will put the output there called "scaled.png"
-- note: scale should be given as a decimal e.g. 1.5
--
-- changes:
-- v1.2 updated to use gm.lua library
-- v1.1 doing bilinear filtering by hand

local gm_lib = require("lib/gm")

local image, scale = ...

scale = assert(tonumber(scale))

local h
local working = "working\\"

local function gm(r, args)
  local cmd = gm_lib.path .. " "
  if r then
    local p = assert(io.popen(cmd .. args))
    local ret = assert(p:read("*a"))
    assert(p:close())
    return ret
  else
    --print(cmd .. args)
    return assert(os.execute(cmd .. args))
  end
end

local width, height = gm(true, "identify " .. image):match("(%d+)x(%d+)")
width = assert(tonumber(width))
height = assert(tonumber(height))

--[[
local metadata = {}
h = assert(io.open(image:gsub("%.%w+$", ".txt"), "r"))
local text = assert(h:read("*a"))
assert(h:close())
for key, value in text:gmatch("([%w_]+):(%d+)") do
  metadata[key] = assert(tonumber(value))
end
assert(metadata.origin_x)
assert(metadata.origin_y)
--]]

--scale = string.format("%d", math.floor(scale * 100 + 0.5))

gm(false, "convert " .. image .. " rgba:" .. working .. "image.raw")

h = assert(io.open(working .. "image.raw", "rb"))
local rows = {}
for i = 1, height do
  rows[i] = assert(h:read(4 * width))
end
assert(h:close())

local function round(x)
  local f = x - math.floor(x)
  if f == 0.5 then
    if math.floor(x) % 2 == 0 then
      return math.floor(x)
    else
      return math.ceil(x)
    end
  elseif f < 0.5 then
    return math.floor(x)
  else
    return math.ceil(x)
  end
end

local function antiround(x)
  local f = x - math.floor(x)
  if f == 0.5 then
    if math.floor(x) % 2 == 1 then
      return math.floor(x)
    else
      return math.ceil(x)
    end
  elseif f < 0.5 then
    return math.floor(x)
  else
    return math.ceil(x)
  end
end

local function getp(x, y)
  if x < 0 or y < 0 then
    return 0, 0, 0, 0
  elseif x >= width or y >= height then
    return 0, 0, 0, 0
  else
    return rows[y + 1]:byte(x * 4 + 1, x * 4 + 4)
  end
end

local function bilinear_c(tx, ty, p00, p01, p10, p11)
  local p0y = (1 - ty) * p00 + ty * p01
  local p1y = (1 - ty) * p10 + ty * p11
  local pxy = (1 - tx) * p0y + tx * p1y
  return pxy
end

local function lerp_a(t, p0, p1, a0, a1)
  local c = (1 - t) * (a0 / 255) + t * (a1 / 255)
  if c == 0 then
    return (1 - t) * p0 + t * p1
  else
    return ((1 - t) * (a0 / 255) * p0 + t * (a1 / 255) * p1) / c
  end
end

local function bilinear_ca(tx, ty, p00, p01, p10, p11, a00, a01, a10, a11)
  local p0y = lerp_a(ty, p00, p01, a00, a01)
  local p1y = lerp_a(ty, p10, p11, a10, a11)
  local a0y = (1 - ty) * a00 + ty * a01
  local a1y = (1 - ty) * a10 + ty * a11
  local pxy = lerp_a(tx, p0y, p1y, a0y, a1y)
  return pxy
end

local function bilinear(tx, ty)
  local x0 = math.floor(tx)
  local x1 = math.ceil(tx)
  local y0 = math.floor(ty)
  local y1 = math.ceil(ty)
  tx = tx - x0
  ty = ty - y0
  
  local p00_r, p00_g, p00_b, p00_a = getp(x0, y0)
  local p01_r, p01_g, p01_b, p01_a = getp(x0, y1)
  local p10_r, p10_g, p10_b, p10_a = getp(x1, y0)
  local p11_r, p11_g, p11_b, p11_a = getp(x1, y1)
  
  local pxy_r = bilinear_ca(tx, ty, p00_r, p01_r, p10_r, p11_r, p00_a, p01_a, p10_a, p11_a)
  local pxy_g = bilinear_ca(tx, ty, p00_g, p01_g, p10_g, p11_g, p00_a, p01_a, p10_a, p11_a)
  local pxy_b = bilinear_ca(tx, ty, p00_b, p01_b, p10_b, p11_b, p00_a, p01_a, p10_a, p11_a)
  local pxy_a = bilinear_c(tx, ty, p00_a, p01_a, p10_a, p11_a)
  
  --print(pxy_r, pxy_g, pxy_b, pxy_a)
  
  pxy_r = math.floor(pxy_r + 0.5)
  pxy_g = math.floor(pxy_g + 0.5)
  pxy_b = math.floor(pxy_b + 0.5)
  pxy_a = math.floor(pxy_a + 0.5)
  
  return string.char(pxy_r, pxy_g, pxy_b, pxy_a)
end

local out = ""

local out_width = round(width * scale)
local out_height = round(height * scale)

-- final scaling: x ~ 0.39375              (dest_off_x = 0.425; origin_off = 0.5)
-- final scaling: y ~ 0.38125 within 0.025 (dest_off_y = 0.975; origin_off = 0.5)

--print((.5 + metadata.origin_x) / width)
--print((.5 + metadata.origin_y) / height)

function calculate_offset(width, out_width)
  s_width = antiround(width * scale)

  --print("scaled width", s_width, "(usual)", out_width, "(raw)", width * scale)

  --print("first", (-1 + 0) / scale)
  --print("last ", (s_width + 0) / scale)

  --print("first f", (-1 + .55) / scale)
  --print("last f ", (s_width + .55) / scale)
  local err = (s_width / scale) % 1
  local slack = 1 / scale
  local X
  if err + slack > 1 then
    --print("err + slack > 1")
    --    slack - X = (err + slack) % 1) - (slack - X)
    --    -2X = ((err + slack) % 1) - 2*slack
    --print(err, slack)
    X = ((err + slack) % 1) / -2 + slack
  else
    --print("err + slack <= 1")
    --    slack - X = err + X
    --print(err, slack)
    X = (slack - err) / 2
  end
  --print(X, X * scale)
  return X * scale
end

off_x = calculate_offset(width, out_width)
--calculate_offset(height, out_height)
off_y = off_x
--off_x = 0; off_y = 0

for out_y = -1, out_height - 2 do
  local ty = (out_y + off_y) / scale
  --print(ty)
  for out_x = -1, out_width - 2 do
    local tx = (out_x + off_x) / scale
    out = out .. bilinear(tx, ty)
  end
end

h = assert(io.open(working .. "scaled.raw", "wb"))
assert(h:write(out))
assert(h:close())

gm(false, "convert -size " .. out_width .. "x" .. out_height .. " " ..
  "rgba:" .. working .. "scaled.raw " ..
  working .. "scaled.png")

--gm(false, "convert "..working.."scaled.png -crop 30x40+20+17 "..working.."chop.png")
