local dl = require("lib/download")
local parse_al = require("lib/parse_al")
local missile = require("lib/missile")
local ability = require("lib/ability")

local skills = dl.getfile(nil, "SkillList.atb")
skills = parse_al.parse(skills)
skills = parse_al.totable(skills)

local skill_types = dl.getfile(nil, "SkillTypeList.atb")
skill_types = parse_al.parse(skill_types)
skill_types = parse_al.totable(skill_types)

local skill_influence = dl.getfile(nil, "SkillInfluenceConfig.atb")
skill_influence = parse_al.parse(skill_influence)
skill_influence = parse_al.totable(skill_influence)

local skill_text = dl.getfile(nil, "SkillText.atb")
skill_text = parse_al.parse(skill_text)
skill_text = parse_al.totable(skill_text)

local influence_lookup = {
  [1] = {name = "Dummy"},
  [2] = {name = "ATK"},
  [3] = {name = "ATK/alt"},
  [4] = {name = "DEF"},
  [5] = {name = "DEF/alt"},
  [6] = {name = "Range"},
  [7] = {name = "Attack count"},
  [8] = {name = "Splash mod"},
  [9] = {name = "Dodge(*)", type = "dodge"},
  [10] = {name = "Forsee"},
  [11] = {name = "HP"},
  [12] = {name = "Block"},
  [13] = {name = "Melee target count"},
  [14] = {name = "Attack cooldown"},
  [15] = {name = "Dancer mod"},
  --
  [19] = {name = "Magic resist"},
  --
  [21] = {name = "Missile", type = "missile"},
  [22] = {name = "Ranged target count"},
  -- 23 Meteor Tactics (projectile delay)
  -- 24 Shadow Sword (one attack?), Anelia SAW
  --
  [30] = {name = "Assassination"},
  [31] = {name = "Heal HP%"},
  [32] = {name = "Generate unit points"},
  [33] = {name = "Physical damage reduction"},
  [34] = {name = "Magic damage reduction"},
  [35] = {name = "Attack restores HP%"},
  [36] = {name = "Immortal", type = "flag"},
  [37] = {name = "Reduce enemy ATK"},
  [38] = {name = "Magic damage", type = "flag"},
  [39] = {name = "True damage", type = "flag"},
  [40] = {name = "Auto-revive to HP%"},
  [41] = {name = "Paralyze on skill end", type = "flag"},
  [42] = {name = "Lose HP% on skill end"},
  -- 43 affects nearby: Protetction = 1
  [44] = {name = "Melee attack area (?)", type = "flag"},
  -- 45 jSlow Magic
  [46] = {name = "Heal status"},
  [47] = {name = "Animation change", type = "enum", enum = {"STAND", "ATTACK", "ALL"}},
  -- 48 attack mode switch related? animation?
  [49] = {name = "Skill swap", type = "skill"},
  [50] = {name = "Auto-use", type = "flag"},
  [51] = {name = "Regeneration", type = "over_time"},
  [52] = {name = "Valkyrie UP modifier"},
  [53] = {name = "Ground only area attack", type = "raw"},
  [54] = {name = "Nullify attack chance"},
  --
  [55] = {name = "Permanent mode change", type = "flag"},
  --
  [57] = {name = "Counter"},
  -- 58 Cross Slash, Rock Cleaver
  [59] = {name = "Reduce enemy MR"},
  [60] = {name = "Reduce enemy DEF"},
  [61] = {name = "Cannot be targeted"},
  -- 62 Curse Voice
  -- 63 Curse Voice
  [64] = {name = "Heal by ATK"},
  [65] = {name = "Unit points over time", type = "over_time"},
  [66] = {name = "Bonus damage vs flying"},
  [67] = {name = "Bonus damage vs ground"},
  -- 68 Rock Cleaver, Final Trump Card
  -- 69 Cross Slash, Final Trump Card (FX)
  -- 70 Rock Cleaver, Final Trump Card (FX)
  [71] = {name = "Attack heals nearby allies"},
  --
  -- 76 True Silver's Brilliance (disable mithril arms block?)
  -- 77 True Silver's Brilliance (boost mithril arms crit rate?)
  --
  [84] = {name = "Unit cost"},
  [85] = {name = "ATK with rarity"},
  [86] = {name = "Lose HP% on skill end with rarity"},
  [87] = {name = "DEF with rarity"},
  --
  -- 107 used by Raise Morale (permanent?)
  [108] = {name = "Lose HP%"},
  --
  -- 110 used by Heal I/II/III = 0 (added in patch, effect unknown)
  [122] = {name = "Add ability config", type = "ability"},
}

local influence_target = {
  [1] = "RaiseMorale",
  [2] = "Self",
  [3] = "Nearby",
  [4] = "All",
  [15] = "AllEnemy",
  [17] = "NecromancerTokens",
}

-- Test: 267

-- Battle Styles
--  1 /  0 /  0 [Soldier]
--  4 /  0 /  0 [Ninja]
--  5 /  0 /  0 [Priestess Warrior]
--  6 /  0 /  0 [Mage Armor]
--  7 /  0 /  0 [Archer]
-- 11 /  0 /  0 [Healer]
-- 14 /  0 /  0 [Summoner]
-- 15 /  0 /  0 [Trap]
-- 16 /  0 /  0 [Dancer]
-- 18 / 10 /  5 [Curse User]
-- 19 /  0 /  0 [Dark Priest]
-- 21 /  0 /  0 [Hermit]

-- Collision
--  0 /  0 /  8 /  _ (Meteor Tactics, BRIONAC, Evil Energy, Ultra Meteor Tactics, Sea God Gun Toryaina, Multi-Shot, Full Auto)
--  0 /  0 / 13 / 11 (Healing Wind)
--  0 /  0 / 16 /  _ (Spike Shield, Full Guard, Enfeeble, Guardian's Holy Shield)
--  0 /  0 / 17 /  _ (Secret skill, Crosh Slash, Final Trump Card)
--  1 /  1 / 11 /  8 Swap battle style to 11 (Prayer of Solace, Heal Magic, Prayer of Solace - Fast, God Invocation, True God Invocation, Heal Magic Plus, Change Heal, 228)
--  1 /  1 / 12 /  _ (Area Heal)
--  1 /  1 / 13 / 11 (Heal Shower)
--  2 /  1 /  4 /  _ (Mode Change, Shooting Stance, Fire Breath, Super Explosive Iron Ball, Evil Sword Answerer, Whirlwind of Death, Gale Thunder, Heat Breath, jThunder Bolt, 245, Shadow Sword)
--  2 /  1 /  7 /  _ Swap battle style to 7 (Flame of Exorcism, God Invocation Cancel, True God Invocation Cancel, Change Attack, 259)
--  3 /  1 /  3 /  6 (Pegasus Wing, Little Wing, Angel Wings of Annhiliation)
--  3 /  1 /  9 /  _ (jSlow Magic, Thunder Rain, Barrier of Evil Elimination, 269)
--  3 /  1 / 10 / 12 (Barrier of Evil Sealing)
--  4 /  1 /  0 /  _ (Efreet, Phoenix, True Phoenix)
--  5 /  1 /  0 /  _ (Protection I, Protection II, Secret Arts of Bewitching, Soothing Treasure, Saint's Barrier)
--  5 /  2 /  0 /  _ (Soul Step, Passion Step, Full Support)
--  6 /  1 / 20 /  _ (Seismic Fist, Light Sword Claidheamh Soluis, Qigong Spiral Wave)

local collision_lookup = {
  [1] = "[Heal]",
  [2] = "[Attack]",
  [3] = "[AreaAttack]",
  [4] = "[SummonAttack]",
  [5] = "[AreaBuff]",
  [6] = "[GroundAttack]",
}

local collision_state_lookup = {
  [1] = "[Default]",
  [2] = "[Dancer]",
}

local function_lookup = {
  [1] = "[Melee]",
  [3] = "[Pegasus]",
  [4] = "[MeleeWithRange]",
  [5] = "[PriestWarrior]",
  [6] = "[MageArmor]",
  [7] = "[Ranged]",
  [8] = "[RangedMultiTarget]",
  [9] = "[RangedSingleAttack]",
  [11] = "[Healer]",
  [15] = "[Trap]",
  [16] = "[Passive]",
  [20] = "[GroundAttack]",
}

local function parse(id)
  local out = ""
  local skill = skills[id + 1]
  out = out .. "Skill Name: " .. skill.SkillName .. "; "
  out = out .. "ID: " .. id .. "; "
  out = out .. "Levels: " .. skill.LevelMax .. "\n"
  if id == 0 then
    return out
  end
  out = out .. "Cooldown: " .. skill.WaitTime .. " - Level\n"
  out = out .. "Duration: " .. skill.ContTime .. " .. " .. skill.ContTimeMax .. "\n"
  out = out .. "Skill Power: " .. skill.Power .. " .. " .. skill.PowerMax .. "\n"
  local text_id = skill.ID_Text
  local description = skill_text[text_id + 1]
  out = out .. "Description:\n\t" .. description.Data_Text:gsub("\n", "\n\t") .. "\n"
  if skill_text.Recode_Index ~= nil and skill_text.Recode_Index ~= 0 then
    print(skill_text.Recode_Index)
    out = out .. "Recode (?): " .. skill_text.Recode_Index .. "\n"
  end
  local type_id = skill.SkillType
  local skill_type = nil
  for _, t in ipairs(skill_types) do
    if t.SkillTypeID == type_id then
      skill_type = t
      break
    end
  end
  if skill_type ~= nil then
    local influence_id = skill_type.ID_Influence
    local influence_records = {}
    local found = false
    for _, influence in ipairs(skill_influence) do
      if influence.Data_ID == influence_id or found and influence.Data_ID == 0 then
        found = true
        table.insert(influence_records, influence)
      elseif found then
        break
      end
    end
    if #influence_records > 0 then
      local primary = influence_records[1]
      local type_fields = {}
      if primary.Type_Collision ~= 0 then
        local x = primary.Type_Collision
        x = collision_lookup[x] or x
        table.insert(type_fields, "Collision: " .. x)
      end
      if primary.Type_CollisionState ~= 0 then
        local x = primary.Type_CollisionState
        x = collision_state_lookup[x] or x
        table.insert(type_fields, "Collision State: " .. x)
      end
      if primary.Type_ChangeFunction ~= 0 then
        local x = primary.Type_ChangeFunction
        x = function_lookup[x] or x
        table.insert(type_fields, "Function: " .. x)
      end
      if primary.Data_InfluenceType == 1 and primary.Data_Target ~= 0 and primary.Data_Target ~= 2 then
        table.insert(type_fields, "X: " .. primary.Data_Target)
      end
      if #type_fields > 0 then
        out = out .. table.concat(type_fields, "; ") .. "\n"
      end
      out = out .. "Influences: (" .. influence_id .. ")\n"
    end
    for i, influence in ipairs(influence_records) do
      if i ~= 1 then
        assert(influence.Type_Collision == 0)
        assert(influence.Type_CollisionState == 0)
        assert(influence.Type_ChangeFunction == 0)
      end
      local info = influence_lookup[influence.Data_InfluenceType]
      if info then
        out = out .. "\t" .. info.name .. " (" .. influence.Data_InfluenceType .. "): "
      else
        out = out .. "\tID " .. influence.Data_InfluenceType .. ": "
      end
      if influence.Data_InfluenceType ~= 1 and influence.Data_Target ~= 0 then
        local target = influence.Data_Target
        local target_info = influence_target[target]
        if target_info then
          out = out .. "(" .. target_info .. ") "
        else
          out = out .. "(Target " .. target .. ")"
        end
      end
      local key_value = nil
      local desc = "unknown"
      local m1 = influence.Data_MulValue
      local m2 = influence.Data_MulValue2
      local m3 = influence.Data_MulValue3
      local a1 = influence.Data_AddValue
      local summary = "(" .. m1 .. "/" .. m2 .. "/" .. m3 .. "/" .. a1 .. ")"
      if info and (info.type == "flag" or info.type == "flag+value") then
        if a1 == 0 then
          desc = "FALSE"
        elseif a1 == 1 then
          desc = "TRUE"
        else
          desc = "???"
        end
        if info.type == "flag+value" then
          desc = desc .. ", " .. info.value .. " = " .. m1
        end
        desc = desc .. " " .. summary
      elseif info and info.type == "ability" and m1 == 0 and m2 == 0 and m3 == 0 then
        desc = "\n\t\t" .. ability.parse_config(a1):gsub("\n(.)", "\n\t\t%1") .. "\t\t" .. summary
      elseif info and info.type == "enum" and m1 == 0 and m2 == 0 and m3 == 0 then
        desc = (info.enum[a1] or "???") .. " " .. summary
      elseif info and info.type == "over_time" and m2 == 0 and m3 == 0 then
        desc = a1 .. " every " .. m1 .. " frames " .. summary
      elseif info and info.type == "missile" and m1 == 0 and m2 == 0 and m3 == 0 then
        desc = "\n\t\t" .. missile.parse(a1):gsub("\n(.)", "\n\t\t%1") .. "\t\t" .. summary
      elseif info and info.type == "raw" then
        desc = summary
      elseif m1 == 0 and m2 == 0 and m3 == 0 then
        desc = "= " .. a1
      else
        local pow_string
        if m2 == 100 then
          pow_string = "POW%"
        elseif m2 == 0 then
          pow_string = nil
        else
          pow_string = "(" .. (m2/100) .. "*(POW - 100) + 100)%"
        end
        if m3 ~= 0 and pow_string then
          pow_string = pow_string:gsub("POW", tostring(m3))
        end
        local suffix = ""
        if a1 ~= 0 then
          suffix = ", += " .. a1
        end
        if m1 == 100 then
          if pow_string then
            desc = " *= " .. pow_string .. suffix
          else
            if suffix ~= "" then
              desc = "base" .. suffix
            else
              desc = "(no change)"
            end
          end
        else
          if pow_string then
            desc = " = " .. m1 .. "% base * " .. pow_string .. suffix
          else
            desc = " = " .. m1 .. "% base" .. suffix
          end
        end
        desc = desc .. " " .. summary
      end
      out = out .. desc .. "\n"
      if influence._Expression and influence._Expression ~= "" then
        out = out .. "\t  Expression: " .. influence._Expression .. "\n"
      end
      if influence._ExpressionActivate and influence._ExpressionActivate ~= "" then
        out = out .. "\t  Expression (Activate): " .. influence._ExpressionActivate .. "\n"
      end
    end
  end
  return out
end

local function find_influence(id)
  local t_lookup = {}
  for _, t in ipairs(skill_types) do
    if t.ID_Influence == id then
      t_lookup[t.SkillTypeID] = true
    end
  end
  local ids = {}
  for index, skill in ipairs(skills) do
    if t_lookup[skill.SkillType] then
      table.insert(ids, index - 1)
    end
  end
  return ids
end

return {
  parse = parse,
  find_influence = find_influence,
}
