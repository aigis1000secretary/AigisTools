-- decompress.lua library
-- v1.2
-- author: lzlis
-- changes:
-- v1.2  : faster decompression
-- v1.1  : fixed extraneous print statement
--         fixed theoretical problem with very large files


local lookup = [[01 00 04 08 01 10 01 20 02 00 05 08 02 10 02 20 03 00 06 08 03 10 03 20 04 00 07 08 04 10 04 20 05 00 08 08 05 10 05 20 06 00 09 08 06 10 06 20 07 00 0A 08 07 10 07 20 08 00 0B 08 08 10 08 20 09 00 04 09 09 10 09 20 0A 00 05 09 0A 10 0A 20 0B 00 06 09 0B 10 0B 20 0C 00 07 09 0C 10 0C 20 0D 00 08 09 0D 10 0D 20 0E 00 09 09 0E 10 0E 20 0F 00 0A 09 0F 10 0F 20 10 00 0B 09 10 10 10 20 11 00 04 0A 11 10 11 20 12 00 05 0A 12 10 12 20 13 00 06 0A 13 10 13 20 14 00 07 0A 14 10 14 20 15 00 08 0A 15 10 15 20 16 00 09 0A 16 10 16 20 17 00 0A 0A 17 10 17 20 18 00 0B 0A 18 10 18 20 19 00 04 0B 19 10 19 20 1A 00 05 0B 1A 10 1A 20 1B 00 06 0B 1B 10 1B 20 1C 00 07 0B 1C 10 1C 20 1D 00 08 0B 1D 10 1D 20 1E 00 09 0B 1E 10 1E 20 1F 00 0A 0B 1F 10 1F 20 20 00 0B 0B 20 10 20 20 21 00 04 0C 21 10 21 20 22 00 05 0C 22 10 22 20 23 00 06 0C 23 10 23 20 24 00 07 0C 24 10 24 20 25 00 08 0C 25 10 25 20 26 00 09 0C 26 10 26 20 27 00 0A 0C 27 10 27 20 28 00 0B 0C 28 10 28 20 29 00 04 0D 29 10 29 20 2A 00 05 0D 2A 10 2A 20 2B 00 06 0D 2B 10 2B 20 2C 00 07 0D 2C 10 2C 20 2D 00 08 0D 2D 10 2D 20 2E 00 09 0D 2E 10 2E 20 2F 00 0A 0D 2F 10 2F 20 30 00 0B 0D 30 10 30 20 31 00 04 0E 31 10 31 20 32 00 05 0E 32 10 32 20 33 00 06 0E 33 10 33 20 34 00 07 0E 34 10 34 20 35 00 08 0E 35 10 35 20 36 00 09 0E 36 10 36 20 37 00 0A 0E 37 10 37 20 38 00 0B 0E 38 10 38 20 39 00 04 0F 39 10 39 20 3A 00 05 0F 3A 10 3A 20 3B 00 06 0F 3B 10 3B 20 3C 00 07 0F 3C 10 3C 20 01 08 08 0F 3D 10 3D 20 01 10 09 0F 3E 10 3E 20 01 18 0A 0F 3F 10 3F 20 01 20 0B 0F 40 10 40 20]]
lookup = lookup:gsub("(%x%x)%s*", function(n) return string.char(tonumber(n, 16)) end)

local function decompress(text)

  local i = 1
  
  -- parse size
  local size = 0
  local bits = 0
  while true do
    local n = text:byte(i)
    --print("%02x", n)
    if bits + 7 < 32 then
      size = size | ((n & 0x7f) << bits)
      bits = bits + 7
      i = i + 1
      if n & 0x80 == 0 then
        break
      end
    else
      assert(n < 16)
      size = size | (n << bits)
      bits = bits + 4
      i = i + 1
      assert(bits == 32)
      break
    end
  end
  
  -- parse actual contents
  local dst = setmetatable({_tail = "", _buffer = {}}, {
    __index = {
      byte = function(self, idx)
        if idx < 0 then idx = 1 + #self + idx end
        idx = idx - 1
        local section = 1 + (idx // 256)
        --print(section, #self._buffer)
        if section > #self._buffer then
          --print(self._tail, #self._tail, idx, #self)
          return self._tail:byte(1 + (idx & 255))
        end
        return self._buffer[section]:byte(1 + (idx & 255))
      end,
      add = function(self, byt)
        self._tail = self._tail .. string.char(byt)
        if #self._tail == 256 then
          table.insert(self._buffer, self._tail)
          self._tail = ""
        end
      end,
      tostring = function(self)
        return table.concat(self._buffer) .. self._tail
      end,
    },
    __len = function(self)
      return (#self._buffer << 8) + #self._tail
    end,
  })
  
  while true do
    if i > #text then break end
    local b = text:byte(i); i = i + 1
    local low = b & 3
    if low > 0 then
      -- dict
      --print("lz at", ("%x"):format(i - 2))
      local lookup_value = lookup:byte((b << 1) + 1) | (lookup:byte((b << 1) + 2) << 8)
      --print("lz ctrl", b)
      --print("lz lookup", ("%x"):format(lookup_value))
      local len = lookup_value >> 11
      local lz_offset = 0
      local shift = 0
      --print("lz len", len, ("%x"):format(i - 1))
      while len > 0 do
        --print("ha", (text:byte(i)))
        lz_offset = lz_offset | (text:byte(i) << shift)
        i = i + 1
        shift = shift + 8
        len = len - 1
      end
      lz_offset = lz_offset + (lookup_value & 0x0700)
      local lz_length = lookup_value & 0xff
      --[[
      print(lz_offset, lz_length)
      --]]
      for _ = 1, lz_length do
        dst:add(dst:byte(-lz_offset))
      end
      
    else
      -- literal
      --print("literal at", ("%x"):format(i - 2))
      b = b >> 2
      -- b in 0..63
      if b >= 60 then
        -- long literal
        local len = b - 59
        b = 0
        local shift = 0
        while len > 0 do
          b = b | (text:byte(i) << shift)
          i = i + 1
          shift = shift + 8
          len = len - 1
        end
      end
      b = b + 1
      local literal = text:sub(i, i + b - 1)
      --print(literal)
      --decompressed = decompressed .. literal
      for j = 1, #literal do
        dst:add(literal:byte(j))
      end
      i = i + b
    end
  end
  
  local decompressed = dst:tostring()
  --print(#decompressed, size)
  assert(#decompressed == size)
  
  return decompressed
end

return {
  decompress = decompress,
}
