-- parse_enemy.lua
-- v1.0
-- author: lzlis

local dl = require("lib/download")
local parse = require("lib/parse_al")

local kAttributeArmored = "アーマー"
local kAttributeUndead = "アンデッド"
local kAttributeStealth = "ステルス"
local attributeMap = {
  [kAttributeArmored] = "Armored",
  [kAttributeUndead] = "Undead",
  [kAttributeStealth] = "Stealth",
}

local enemy_table_name = "Enemy.atb"
local enemy_id, opt = ...
local reproduce = nil
if enemy_id:match("r%d+/%d+") then
  reproduce, enemy_id = enemy_id:match("r(%d+)/(%d+)")
  reproduce = string.format("%06d", tonumber(reproduce))
elseif enemy_id:match("%d+/%d+") then
  local table_num
  table_num, enemy_id = enemy_id:match("(%d+)/(%d+)")
  enemy_table_name = string.format("Enemy%06d.atb", table_num)
end

local gfx_names = {}
local f_gfx_names = assert(io.open("Data/meta/enemy_gfx.txt", 'r'))
local i = 1
for l in f_gfx_names:lines() do
  gfx_names[i] = l
  i = i + 1
end
assert(f_gfx_names:close())


enemy_id = assert(tonumber(enemy_id))

local fast = opt == "fast"

local files = {
  --"EnemyStory1.aar",
  --"EnemyEvent.aar",
  "EnemyReproduce.aar",
  --"EnemyDaily.aar",
  --"EnemyDot0484.aar",
}

local files_text = {}
local enemy_table = nil
local getfiles = false
if reproduce then
  reproduce = dl.getfile(nil, "Reproduce" .. reproduce .. ".aar")
  reproduce = parse.parse(reproduce)
  for _, archfile in ipairs(reproduce) do
    if archfile.name:match("EnemyReproduce%d+%.aar") then
      files_text[archfile.name] = archfile.value
    elseif archfile.name:match("Enemy%d+%.atb") then
      enemy_table = archfile.value
    end
  end
else
  getfiles = true
end

local text
local enemies
if enemy_table then
  enemies = enemy_table
else
  text = dl.getfile(nil, enemy_table_name)
  enemies = parse.parse(text)
end

local enemy = assert(enemies[enemy_id])
  
for idx, field in ipairs(enemy) do
  local head = enemies.header.object[idx]
  enemy[head.name_en] = field.v
end

local dotnum = (enemy.PatternID - 0x200000) // 0x100
local dotarch_name = string.format("EnemyDot%04d.aar", dotnum)
if dl.listhasfile(nil, dotarch_name) then
  files = {dotarch_name}
end

if getfiles then
  for _, file in ipairs(files) do
    files_text[file] = dl.getfile(nil, file)
  end
end

local arch_map = {}

if not fast then
  
  for file, text in pairs(files_text) do
    local pattern_map = {}
    
    print(file)
    
    local archive
    if type(text) == "string" then
      archive = parse.parse(text)
    else
      archive = text
    end
    
    for _, archfile in ipairs(archive) do
      if archfile.name == "Attack.aod" then
        assert(archfile.value.type == "ALOD")
        local pattern = archfile.value.mt and archfile.value.mt.pattern
        if pattern then
          pattern = pattern & ~0xff
          --print(string.format("found pattern %x", pattern))
          assert(pattern_map[pattern] == nil)
          pattern_map[pattern] = archfile.value
        end
      end
    end
    
    pattern_map.textures = archive.textures
    assert(pattern_map.textures)
    
    arch_map[file] = pattern_map
    
  end
  
end

text = dl.getfile(nil, "Missile.atb")

local missiles = parse.parse(text)

local missile = assert(missiles[enemy.MissileID + 1])
  
for idx, field in ipairs(missile) do
  local head = missiles.header.object[idx]
  missile[head.name_en] = field.v
end

text = dl.getfile(nil, "GroupConfig.atb")

local group_rows = parse.parse(text)
group_rows = parse.totable(group_rows)

local deflectable = {}
for _, row in ipairs(group_rows) do
  local id = row.MissileID_Reflection
  if id ~= 0 then
    deflectable[id - 1] = true
  end
end

enemy.Attributes = {}
if type(enemy._Attribute) == "string" then
  for attrb in enemy._Attribute:gmatch("[^,]+") do
    enemy.Attributes[attrb] = true
  end
end

local dotscale = enemy.DotRate
local range = enemy.ATTACK_RANGE
local gfx_index = (enemy.PatternID - 0x00200000) // 0x100
--if gfx_names[gfx_index] then
  print("GFX", gfx_names[gfx_index], "("..gfx_index..")")
--end
if range > 0 then
  print("range", range, range * dotscale / 1.5)
  print("pspd", missile.Speed, "deflect", deflectable[enemy.MissileID] and "y" or "n", "(MissileID)", enemy.MissileID)
else
  print("melee")
end
local enemyType = ""
if enemy.BossFlag ~= 0 then
  enemyType = enemyType .. "BOSS! "
end
if enemy.Attribute == 1 or enemy.Attributes[kAttributeUndead] then
  enemyType = enemyType .. "Undead "
end
if enemy.Attributes[kAttributeArmored] then
  enemyType = enemyType .. "Armored "
end
if enemy.SkyFlag ~= 0 then
  enemyType = enemyType .. "Flying "
end
if enemy.Type > 0 then
  local types = {
    [1] = "Armored",
    [2] = "Dragon",
    [3] = "Demon",
    [4] = "Mononoke",
    [5] = "Golem",
    [6] = "Angel",
    [7] = "Merman",
    [8] = "Orc",
    [9] = "Goblin",
  }
  enemyType = enemyType .. (types[enemy.Type] or "UNK"..enemy.Type) .. " "
end
if enemyType ~= "" then
  print("TYP", enemyType)
end
local dt = enemy.MagicAttack ~= 0 and "magic" or "physical"
print("HP", enemy.HP)
local attack = enemy.ATTACK_POWER .. " " .. dt
if missile.DamageArea > 0 then
  attack = attack .. " splash " .. missile.DamageArea
end
print("ATK", attack)
print("DEF", enemy.ARMOR_DEFENSE, "MR", enemy.MAGIC_DEFENSE, "AR", enemy.Param_ResistanceAssassin, "(" .. (enemy.Param_ResistanceAssassin/1000) .. ")")
--print("MR", enemy.MAGIC_DEFENSE)
--print("AR", enemy.Param_ResistanceAssassin)
print()
print("MOV", enemy.MOVE_SPEED)
print("SCL", enemy.DotRate)
print()
local attack_frame = enemy.AttackAnimNo

local found = false
local pattern = enemy.PatternID
--print(string.format("need pattern %0x", pattern))
if pattern then
  for arch_name, pattern_map in pairs(arch_map) do
    local where = "enemy_gfx\\" .. arch_name .. "\\"
    local aod = pattern_map[pattern]
    if aod then
    
    end
    for p, aod in pairs(pattern_map) do
      if p == pattern then
        if aod.mt and aod.mt.entries[1] and aod.mt.entries[1].data and aod.mt.entries[1].data.PatternNo then
          local ftimes = {}
          for _, f in ipairs(aod.mt.entries[1].data.PatternNo) do ftimes[#ftimes+1] = f.time end
          local str = arch_name .. " "
          --print("FR", arch_name, aod.mt.length, table.unpack(ftimes))
          if range == 0 then
            str = str .. "FAS ".. (1 + enemy.ATTACK_SPEED + aod.mt.length + 2 * enemy.AttackWait)
          else
            str = str .. "FAS ".. (1 + aod.mt.length + 2 * enemy.AttackWait)
          end
          if aod.mt.entries[1].data.PatternNo[1 + attack_frame] then
            found = true
            str = str .. " FIN " .. (aod.mt.entries[1].data.PatternNo[1 + attack_frame].time) -- +1 is Lua-indexing offset
          else
            str = str .. " FIN bad"
          end
          if range > 0 then
            str = str .. " FMV " .. (enemy.AttackWait * 2 + 1)
          end
          print(str)
        else
          print("FR", arch_name, "?")
        end
      end
    end
  end
end

if not found then
  print("AS", enemy.ATTACK_SPEED)
  print("AW", enemy.AttackWait, "MOVE", enemy.AttackWait * 2 + 1)
  print("AF", enemy.AttackAnimNo)
end

print()

if enemy.ATTACK_TYPE ~= 0 then
  print("ATKTY", enemy.ATTACK_TYPE)
end

if missile.SlowTime > 0 or missile.SlowRate > 0 then
  print("SLOW", missile.SlowTime, missile.SlowRate .. "%")
end

if enemy.Attribute ~= 0 then
  local lookup = {
    [1] = "Undead",
    [2] = "Stealth",
  }
  print("ATTRB", lookup[enemy.Attribute] or "UNK" .. enemy.Attribute)
end
for attrb, _ in pairs(enemy.Attributes) do
  print("ATTRB", attributeMap[attrb] or attrb)
end

if enemy.SpecialEffect ~= 0 then
  local lookup = {
    --[1] = ??? this is on some of the crystal guardians
    [2]  = "Paralyze(Roper)",
    [3]  = "Yurina(?)", 
    [4]  = "Aura",
    [5]  = "Avenger+Aura", -- Dark Elf Avenger
    [6]  = "MagicFencer", -- Half damage at range
    [7]  = "MagicFencer+Aura",
    [8]  = "AttackX4+Aura",
    [9]  = "Mummy", -- Attack bonus with low HP
    [10] = "AttackX5",
    [11] = "DontStopToAttack",
    [12] = "Shadow", -- Minotaur special
    [13] = "ShadowCaster", -- Minotaur special
    [14] = "AttackAllInRange",
    [15] = "Paralyze(Vampire)",
    [16] = "AttackX2(?)",
    [17] = "AttackX2+Aura(?)",
    [18] = "MononokeBoost", -- 5200 in entry file
    [19] = "Dancer",
    [20] = "UndeadBoost+Aura", -- 5200 in entry file
    [22] = "Paralyze(Eden)",
    [23] = "Explode(100%)",
    [24] = "Retreats", -- Emilia (M1)
    [26] = "DarkKnight(AttackPenalty)", -- Year End Gold Rush version
    [28] = "DarkKnight(Degenerating+AttackPenalty)",
    [30] = "AttacksAllInRange+Aura", -- Anelia
    -- 34+ are in the config file
    [46] = "Regenerating(60/30000)+Aura", -- Spirit Rescue G
    [47] = "Regenerating(400/30000)+Aura", -- Spirit Rescue G Gold Werewolf
  }
  print("EFF", lookup[enemy.SpecialEffect] or "UNK" .. enemy.SpecialEffect, "(" .. enemy.SpecialEffect .. ")")
end

if enemy.SKILL ~= 0 then
  print("SKILL", enemy.SKILL)
end

if enemy.Weather ~= 0 then
  print("WEATH", enemy.Weather)
end

if enemy.GainCost ~= 0 then -- gained when killed by Valkyrie or similar
  print("UP", enemy.GainCost)
end

if enemy.DeadEffect ~= 0 then
  print("DEATH", enemy.DeadEffect)
  -- 1: Gold Armor, Gold Living Axe Armor
end

if enemy.Param_ChangeParam ~= 0 or enemy.Param_ChangeCondition ~= 0 then
  local lookup = {
    [1] = "Melee",
    [2] = "Death",
    [3] = "50%",
    [4] = "Attack",
    [5] = "99%",
  }
  print("CHANG", lookup[enemy.Param_ChangeCondition] or "UNK" .. enemy.Param_ChangeCondition, "->", enemy.Param_ChangeParam)
end

if enemy.BgmID ~= 0 then
  print("BGM", enemy.BgmID)
end
