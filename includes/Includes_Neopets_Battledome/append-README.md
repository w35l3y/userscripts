### Description

Creates an interface to easily work with Battledome.

### Constructors
Battledome ([Neopets](https://github.com/w35l3y/userscripts/tree/master/includes/Includes_Neopets_[BETA]) page)

### Methods
**fight**(Object `{petName, opponentId, toughness, plays}`, Function `(result)`)
- Starts a fight `plays` times with `petName` against `opponentId` based on the informations from [Battlepedia](https://github.com/w35l3y/userscripts/tree/master/includes/Includes_JellyNeo_Battlepedia).
- Invokes callback when executed and returns `result`.
- I haven't tested it exhaustively, it attends my needs.
- If you want to use it without errors, you also are welcome to contribute.

**startFight**(Object `{petName, opponentId, toughness}`, Function `(result)`)
- Starts a fight with `petName` against `opponentId`.
- Invokes callback when executed and returns `result`.
- Use it only if you want to create your own algorithm of fighting.

**userPets**(Object `{username}`, Function `(result)`)
- Retrieves informations about the current battle.
- Invokes callback when executed and returns `result`.
