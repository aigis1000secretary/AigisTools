-- curl.lua library
-- v1.0
-- author: lzlis

local curlpath = [[curl]]

local verbose = true

local function execute(...)
  local command = curlpath
  for i = 1, select('#', ...) do
    command = command .. " " .. tostring(select(i, ...))
  end
  if verbose then
    io.stderr:write(command .. "\n")
  end
  assert(os.execute("cmd /C timeout /T 2 1>&2"))
  assert(os.execute("cmd /C " .. command .. " 1>&2"))
end

return {execute = execute}
