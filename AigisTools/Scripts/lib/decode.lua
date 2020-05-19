-- decode.lua library
-- v1.1
-- author: lzlis

local b64 = require("lib/base64")

local function decode(text, key, offset)
  --print(key)
  offset = offset or 1
  local decoded = {}
  local i = 1
  for j = offset, #text do
    local b = text:byte(j)
    b = b ~ key
    decoded[i] = string.char(b)
    i = i + 1
  end
  return table.concat(decoded)
end

local function decode_list(text)
  return decode(text, 0xea ~ 0x30)
end

local function decode_xml(text)
  if text:match("^data%:application%/octet%-stream%;base64%,") then
    text = b64.decode(text:sub(38))
  elseif text:match("^[%a%d%+%/%=]*$") then
    -- appears to be base64 encoded; decode it
    text = b64.decode(text)
  end
  
  for _, start in ipairs{"<?xml version=\"", "<DA>"} do
    --local start = "<?xml version=\""
    local sb1 = start:byte(1)
    for i = 1, math.min(100, #text) do
      local test = true
      local b1 = text:byte(i)
      for j = 2, #start do
        local testval = b1 ~ text:byte(i + j - 1)
        local canon = sb1 ~ start:byte(j)
        if testval ~= canon then
          test = false
          break
        end
      end
      if test then
        return decode(text, sb1 ~ b1, 1)
      end
    end
  end
  error()
end

return {
  decode = decode,
  decode_list = decode_list,
  decode_xml = decode_xml,
}
