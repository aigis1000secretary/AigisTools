-- base64.lua library
-- v1.0
-- author: lzlis

local cs = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"
local b64val = {}
for n, c in cs:gmatch("()(.)") do
  b64val[c] = n - 1
end
b64val["="] = 0

local function decode(b64)
  local enc = string.gsub(b64, "(.)(.)(.)(.)", function(a,b,c,d)
    local n = b64val[a] * (64 * 64 * 64) + b64val[b] * (64 * 64) + b64val[c] * 64 + b64val[d]
    local b1 = n % 256; n = n // 256
    local b2 = n % 256; n = n // 256
    local b3 = n
    if d == "=" then
      if c == "=" then
        assert(b1 == 0 and b2 == 0)
        return string.char(b3)
      else
        assert(b1 == 0)
        return string.char(b3, b2)
      end
    else
      return string.char(b3, b2, b1)
    end
  end)
  return enc
end

return {
  decode = decode
}
