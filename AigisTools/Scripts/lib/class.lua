local dl = require("lib/download")
local parse_al = require("lib/parse_al")

local player_unit_table = dl.getfile(nil, "PlayerUnitTable.aar")
player_unit_table = parse_al.parse(player_unit_table)

local classes = nil
for _, archfile in ipairs(player_unit_table) do
  if archfile.name == "ClassData.atb" then
    classes = archfile.value
    break
  end
end

assert(classes)

classes = parse_al.totable(classes)

local battle_styles = dl.getfile(nil, "ClassBattleStyleConfig.atb")
battle_styles = parse_al.parse(battle_styles)
battle_styles = parse_al.totable(battle_styles)

local classes_by_full_id = {}
local classes_by_partial_id = {}

for _, class in ipairs(classes) do
  classes_by_full_id[class.ClassID] = class
  local partial_id = class.ClassID // 100
  if classes_by_partial_id[partial_id] == nil then
    classes_by_partial_id[partial_id] = class
  end
end

local battle_styles_by_id = {}

for _, battle_style in ipairs(battle_styles) do
  battle_styles_by_id[battle_style.Data_ID] = battle_style
end

local function get_name_p(partial_id)
  local class = classes_by_partial_id[partial_id]
  if class then
    return class.Name
  else
    return "class " .. partial_id
  end
end

local function get(id)
  return classes_by_full_id[id]
end

local function get_battle_style(id)
  return battle_styles_by_id[id]
end

return {
  get = get,
  get_name_p = get_name_p,
  get_battle_style = get_battle_style,
}
