/** Зеркало skill из heroes/medusa/index.json и heroes/tesla/index.json (Unplugged-pack). */

export const medusaSkill = {
  "id": "medusa_skill",
  "heroId": "medusa",
  "name": "Взгляд Медузы",
  "text": "Начало хода: вы можете нанести 1 урон вражескому бойцу в одной области с Медузой.",
  "triggers": [
    {
      "id": "gaze",
      "trigger": "start_turn",
      "conditions": {
        "all": [
          {
            "fact": "HERO_ON_BOARD",
            "params": {
              "fighterId": "medusa"
            }
          },
          {
            "fact": "FIGHTERS_IN_RANGE",
            "params": {
              "sourceId": "medusa",
              "side": "opponent",
              "kind": "fighter"
            },
            "check": {
              "var": "$candidates",
              "operator": "isNonEmpty"
            },
            "return": "$candidates"
          }
        ]
      },
      "actions": [
        {
          "id": "ask_apply",
          "type": "PROMPT",
          "start": true,
          "return": "$answer",
          "conditions": {
            "all": [
              {
                "var": "$answer",
                "operator": "isEmpty"
              },
              {
                "var": "$candidates",
                "operator": "isNonEmpty"
              }
            ]
          },
          "params": {
            "message": "Применить способность героя?",
            "answers": [
              {
                "id": "apply",
                "text": "Да",
                "value": "apply"
              },
              {
                "id": "skip",
                "text": "Нет",
                "value": "skip"
              }
            ]
          },
          "description": "Спросить: применить способность «Взгляд Медузы»?"
        },
        {
          "id": "finish_skip",
          "type": "LOG",
          "end": true,
          "conditions": {
            "all": [
              {
                "var": "$answer",
                "operator": "equal",
                "value": "skip"
              }
            ]
          },
          "params": {
            "message": "Способность не применена"
          },
          "description": "Завершить — способность не применена"
        },
        {
          "id": "pick_target",
          "type": "SELECT_TARGET",
          "return": "$targets",
          "conditions": {
            "all": [
              {
                "var": "$answer",
                "operator": "equal",
                "value": "apply"
              },
              {
                "var": "$targets",
                "operator": "isEmpty"
              },
              {
                "var": "$candidates",
                "operator": "isNonEmpty"
              }
            ]
          },
          "params": {
            "candidates": "$candidates",
            "selection": 1
          },
          "description": "Выбрать вражеского бойца в области Медузы"
        },
        {
          "id": "deal_damage",
          "type": "DAMAGE_FIGHTERS",
          "end": true,
          "conditions": {
            "all": [
              {
                "var": "$answer",
                "operator": "equal",
                "value": "apply"
              },
              {
                "var": "$targets",
                "operator": "isNonEmpty"
              }
            ]
          },
          "params": {
            "targets": "$targets",
            "damage": 1
          },
          "description": "Нанести 1 урон выбранной цели"
        }
      ]
    }
  ]
};

export const teslaSkill = {
  "id": "tesla_skill",
  "heroId": "tesla",
  "name": "Мастерство катушек",
  "text": "В начале игры 1 катушка уже активна. Конец хода: активируйте 1 катушку. Начало хода: если обе катушки активны, нанесите 1 урон каждому вражескому бойцу на соседних с Теслой клетках и передвиньте их на расстояние до 1 клетки.",
  "triggers": [
    {
      "id": "init_coils",
      "trigger": "start_game",
      "actions": [
        {
          "id": "activate_first_coil",
          "type": "TOGGLE_STATE_ITEMS",
          "start": true,
          "end": true,
          "params": {
            "type": "coil",
            "count": 1,
            "state": "active"
          },
          "description": "Активировать 1 катушку в начале игры"
        }
      ]
    },
    {
      "id": "charge_coil",
      "trigger": "end_turn",
      "conditions": {
        "all": [
          {
            "fact": "HERO_ON_BOARD",
            "params": {
              "fighterId": "tesla"
            }
          },
          {
            "fact": "COUNT_ITEMS",
            "params": {
              "type": "coil",
              "state": "inactive"
            },
            "check": {
              "var": "$count",
              "operator": "greater",
              "value": 0
            }
          }
        ]
      },
      "actions": [
        {
          "id": "activate_coil",
          "type": "TOGGLE_STATE_ITEMS",
          "start": true,
          "end": true,
          "params": {
            "type": "coil",
            "count": 1,
            "state": "active"
          },
          "description": "Активировать 1 неактивную катушку в конце хода"
        }
      ]
    },
    {
      "id": "discharge",
      "trigger": "start_turn",
      "conditions": {
        "all": [
          {
            "fact": "HERO_ON_BOARD",
            "params": {
              "fighterId": "tesla"
            }
          },
          {
            "fact": "COUNT_ITEMS",
            "params": {
              "type": "coil",
              "state": "active"
            },
            "check": {
              "var": "$count",
              "operator": "equal",
              "value": 2
            }
          },
          {
            "fact": "FIGHTERS_IN_RANGE",
            "params": {
              "sourceId": "tesla",
              "side": "opponent",
              "kind": "fighter",
              "maxSteps": 1
            },
            "check": {
              "var": "$candidates",
              "operator": "isNonEmpty"
            },
            "return": "$candidates"
          }
        ]
      },
      "actions": [
        {
          "id": "coil_damage",
          "type": "DAMAGE_FIGHTERS",
          "start": true,
          "conditions": {
            "all": [
              {
                "fact": "COUNT_ITEMS",
                "params": {
                  "type": "coil",
                  "state": "active"
                },
                "check": {
                  "var": "$count",
                  "operator": "equal",
                  "value": 2
                }
              },
              {
                "var": "$candidates",
                "operator": "isNonEmpty"
              }
            ]
          },
          "params": {
            "targets": "$candidates",
            "damage": 1
          },
          "description": "Нанести 1 урон каждому врагу на соседней с Теслой клетке"
        },
        {
          "id": "ask_move",
          "type": "PROMPT",
          "return": "$answer",
          "conditions": {
            "all": [
              {
                "var": "$answer",
                "operator": "isEmpty"
              },
              {
                "var": "$candidates",
                "operator": "isNonEmpty"
              }
            ]
          },
          "params": {
            "message": "Переместить соседнего бойца врага на расстояние 1 клетки от Теслы?",
            "answers": [
              {
                "id": "move",
                "text": "Да",
                "value": "move"
              },
              {
                "id": "skip",
                "text": "Нет",
                "value": "skip"
              }
            ]
          },
          "description": "Спросить: переместить соседнего вражеского бойца?"
        },
        {
          "id": "finish_skip",
          "type": "LOG",
          "end": true,
          "conditions": {
            "all": [
              {
                "var": "$answer",
                "operator": "equal",
                "value": "skip"
              }
            ]
          },
          "params": {
            "message": "Передвижение отменено"
          },
          "description": "Завершить — передвижение отменено"
        },
        {
          "id": "select_target",
          "type": "SELECT_TARGET",
          "return": "$targetId",
          "conditions": {
            "all": [
              {
                "var": "$answer",
                "operator": "equal",
                "value": "move"
              },
              {
                "var": "$targetId",
                "operator": "isEmpty"
              },
              {
                "var": "$candidates",
                "operator": "isNonEmpty"
              }
            ]
          },
          "params": {
            "candidates": "$candidates",
            "selection": 1,
            "message": "Выберите бойца для перемещения (осталось: ${remaining})"
          },
          "description": "Выбрать соседнего вражеского бойца из списка"
        },
        {
          "id": "select_cell",
          "type": "SELECT_CELL",
          "return": "$moveCell",
          "conditions": {
            "all": [
              {
                "var": "$answer",
                "operator": "equal",
                "value": "move"
              },
              {
                "var": "$targetId",
                "operator": "isNonEmpty"
              },
              {
                "var": "$moveCell",
                "operator": "isEmpty"
              }
            ]
          },
          "params": {
            "fighterId": "$targetId",
            "maxSteps": 1,
            "fromCurrent": true,
            "message": "Выберите клетку для перемещения (до 1 клетки от Теслы)"
          },
          "description": "Выбрать клетку назначения (до 1 шага)"
        },
        {
          "id": "apply_move",
          "type": "MOVE_FIGHTER",
          "conditions": {
            "all": [
              {
                "var": "$answer",
                "operator": "equal",
                "value": "move"
              },
              {
                "var": "$targetId",
                "operator": "isNonEmpty"
              },
              {
                "var": "$moveCell",
                "operator": "isNonEmpty"
              }
            ]
          },
          "params": {
            "fighterId": "$targetId",
            "cellId": "$moveCell",
            "maxSteps": 1,
            "fromCurrent": true,
            "removeFrom": "candidates"
          },
          "description": "Переместить выбранного бойца на 1 клетку"
        },
        {
          "id": "finish_done",
          "type": "LOG",
          "end": true,
          "conditions": {
            "all": [
              {
                "var": "$candidates",
                "operator": "isEmpty"
              }
            ]
          },
          "params": {
            "message": "Передвижение завершено"
          },
          "description": "Завершить — все соседние бойцы обработаны"
        },
        {
          "id": "loop",
          "type": "RELOOP_PIPELINE",
          "conditions": {
            "all": [
              {
                "var": "$answer",
                "operator": "equal",
                "value": "move"
              },
              {
                "var": "$candidates",
                "operator": "isNonEmpty"
              },
              {
                "var": "$moveCell",
                "operator": "isNonEmpty"
              }
            ]
          },
          "params": {
            "steps": [
              "ask_move",
              "select_target",
              "select_cell",
              "apply_move"
            ],
            "clearVars": [
              "$answer",
              "$targetId",
              "$moveCell"
            ]
          },
          "description": "Повторить цикл для оставшихся соседних бойцов"
        }
      ]
    }
  ]
};
