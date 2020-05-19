-- file.lua library
-- v1.0
-- author: lzlis

local function dir_exists(dir)
  local command = "cmd /C \"dir /A:D /B ^\"" .. dir .. "^\" >NUL 2>&1\""
  --print(command)
  local h = assert(io.popen(command))
  local text = assert(h:read('*a'))
  local result = h:close()
  if result == nil then result = false end
  return result
end

local function file_exists(dir)
  local command = "cmd /C \"dir /A:-D /B ^\"" .. dir .. "^\" >NUL 2>&1\""
  --print(command)
  local h = assert(io.popen(command))
  local text = assert(h:read('*a'))
  local result = h:close()
  if result == nil then result = false end
  return result
end

local function make_dir(dir)
  local command = "cmd /C \"MD ^\"" .. dir .. "^\" >NUL\""
  assert(os.execute(command))
end

return {
  dir_exists = dir_exists,
  file_exists = file_exists,
  make_dir = make_dir,
}
