# Changelog

## [0.3.2](https://github.com/nu-grid/nu-grid-nuxt/compare/v0.3.1...v0.3.2) (2026-02-22)


### ✨ Features

* Ability to show empty groups (useful with add row) ([f07c878](https://github.com/nu-grid/nu-grid-nuxt/commit/f07c87834bf9cea9ebf0b46a3912d53dd522e394))
* Add autofocus prop ([30c9c66](https://github.com/nu-grid/nu-grid-nuxt/commit/30c9c66083f56e32faeb39064085702ab88d44de))
* Add Enter behavior option ([b88e047](https://github.com/nu-grid/nu-grid-nuxt/commit/b88e0474934cbd9a68af29828c411949c32e6a3a))
* Add keydown event with row/column information ([30c9c66](https://github.com/nu-grid/nu-grid-nuxt/commit/30c9c66083f56e32faeb39064085702ab88d44de))
* Add lockSize property ([f8c3999](https://github.com/nu-grid/nu-grid-nuxt/commit/f8c3999ee05eff62efb33105261e1a6bda2be97c))
* Add maintain focus on filter ([5384dad](https://github.com/nu-grid/nu-grid-nuxt/commit/5384dad6896ca2cae07bfbbc8cdc7291875bad83))
* Add showHeaders option ([a09e2b2](https://github.com/nu-grid/nu-grid-nuxt/commit/a09e2b2c85521b882519dd8f5758249e3893a51d))
* Columns are now correctly reactive ([7b1dfb4](https://github.com/nu-grid/nu-grid-nuxt/commit/7b1dfb4f77fb1daf5d3dc93c83aa225be113442c))
* Finished up summary rows ([f07c878](https://github.com/nu-grid/nu-grid-nuxt/commit/f07c87834bf9cea9ebf0b46a3912d53dd522e394))
* Improved tooltips ([356cd23](https://github.com/nu-grid/nu-grid-nuxt/commit/356cd236f5c4ed7aee2cdf70e07f9ccbcb9554ad))
* Nugridselectmenu ([a8e286f](https://github.com/nu-grid/nu-grid-nuxt/commit/a8e286fa3d0032aa6d49a884047e41d999dde1ef))
* Server side paging ([635527c](https://github.com/nu-grid/nu-grid-nuxt/commit/635527c245ce483c9ffd47fe3e21feeb27c56b6f))


### 🐛 Bug Fixes

* Add ! to divider ([026dc88](https://github.com/nu-grid/nu-grid-nuxt/commit/026dc8874edabae61a047106cc82b99faa624a8f))
* Added nexttick to allow for more complex binding ([3d1229d](https://github.com/nu-grid/nu-grid-nuxt/commit/3d1229d2cd1a1e3e05d609791885072c0865fe1e))
* Autosizing fill failed on browser resize ([b82d3eb](https://github.com/nu-grid/nu-grid-nuxt/commit/b82d3ebff9f4ce96112d67869e76caa7118eba1d))
* Boolean inference now checks for strings and 0/1 ([7b1dfb4](https://github.com/nu-grid/nu-grid-nuxt/commit/7b1dfb4f77fb1daf5d3dc93c83aa225be113442c))
* Cell_value_changed should fire after it is actually changed ([b12d4b3](https://github.com/nu-grid/nu-grid-nuxt/commit/b12d4b3dbfb63679fdf9554897e39188d2d02271))
* Compact theme now matches colors and shrinks editors to fit ([6aa5711](https://github.com/nu-grid/nu-grid-nuxt/commit/6aa57112130a9008879021f9710cdb9acf54b25b))
* Fixed compact theme row size and textarea editors for both ([fe3d999](https://github.com/nu-grid/nu-grid-nuxt/commit/fe3d999c21d695ea11f3a14adef825ce24609e4a))
* Horizontal scrolling in virtualized grids ([50b551d](https://github.com/nu-grid/nu-grid-nuxt/commit/50b551d8c7ee590cb0854f1949c50ee893fd17fb))
* Incorrect focused column after exiting edit mode ([920954a](https://github.com/nu-grid/nu-grid-nuxt/commit/920954aa01207e0b954ec74343e408a94e1f7494))
* Move dropdown closer to trigger ([0ff592d](https://github.com/nu-grid/nu-grid-nuxt/commit/0ff592df18b7ada046b871aa7f2846ed7255705a))
* Remove unneeded tbody theming ([9428b3d](https://github.com/nu-grid/nu-grid-nuxt/commit/9428b3d3cdd704685a0cd16cf2aaddf25bbeeb5a))
* Revert unneeded changes ([198bfbd](https://github.com/nu-grid/nu-grid-nuxt/commit/198bfbdf599d57a615c218c50806ad38d13b747d))
* Scrollbar colors ([325b3bf](https://github.com/nu-grid/nu-grid-nuxt/commit/325b3bf4c7aa383602f2127b0a383bf21940ef88))
* Search as you type ([920954a](https://github.com/nu-grid/nu-grid-nuxt/commit/920954aa01207e0b954ec74343e408a94e1f7494))
* Server side paging wasn't properly reloading for state changes ([f47a008](https://github.com/nu-grid/nu-grid-nuxt/commit/f47a0086c50f11157ea3d7e95e59e274ebc18670))
* Various addrow bugs ([dea3aff](https://github.com/nu-grid/nu-grid-nuxt/commit/dea3affa03f8a111b2c08b5e703f58d60fdfb63d))
* Various bugs ([5384dad](https://github.com/nu-grid/nu-grid-nuxt/commit/5384dad6896ca2cae07bfbbc8cdc7291875bad83))
* Warning if addrow is enabled, but focus mode is not cell or editing is disabled ([a8e286f](https://github.com/nu-grid/nu-grid-nuxt/commit/a8e286fa3d0032aa6d49a884047e41d999dde1ef))


### 🏡 Miscellaneous Chores

* Remove html comments ([71f4894](https://github.com/nu-grid/nu-grid-nuxt/commit/71f48943ef9e36d6a9a1ae335090ecedc4b04f53))

## [0.3.1](https://github.com/nu-grid/nu-grid-nuxt/compare/v0.3.0...v0.3.1) (2026-02-02)


### 🐛 Bug Fixes

* Double row bottom border ([3ba2c38](https://github.com/nu-grid/nu-grid-nuxt/commit/3ba2c38f47427aedb3db364f9350dc64e0dd08fe))
* Set resize mode to shift for auto sizing set to fill ([17b6a48](https://github.com/nu-grid/nu-grid-nuxt/commit/17b6a48c79858e584e4d851f2f418d8531f60b06))

## [0.3.0](https://github.com/nu-grid/nu-grid-nuxt/compare/v0.2.0...v0.3.0) (2026-02-02)


### ⚠ BREAKING CHANGES

* rename props to clearer names
* improved autosizing to use flex

### ✨ Features

* Add cell data type auto inferrence ([1071939](https://github.com/nu-grid/nu-grid-nuxt/commit/107193922996a07651c0c8b1aa756f4a15f3dcca))
* Allow selection prop to be a bool ([e0995df](https://github.com/nu-grid/nu-grid-nuxt/commit/e0995df1e7a789744bf5595a7887c5cc70ab1b8e))
* Cell templates ([1527c19](https://github.com/nu-grid/nu-grid-nuxt/commit/1527c193d96a85d10b88fdf64bcfa228404f8b58))
* Improve column resizing smoothness ([6bc48e7](https://github.com/nu-grid/nu-grid-nuxt/commit/6bc48e76a144b96deddcb65c6551db60454f0579))
* Improved autosizing to use flex ([ff5ac59](https://github.com/nu-grid/nu-grid-nuxt/commit/ff5ac59b22a7201260c8665998270b56494c3f7d))
* Improved state persistence of column sizes ([89816ae](https://github.com/nu-grid/nu-grid-nuxt/commit/89816aeecd0bac881d80910e5f81d82b1ba90b17))


### 🐛 Bug Fixes

* Ability to clear state properly ([b6e1916](https://github.com/nu-grid/nu-grid-nuxt/commit/b6e19161911fb223abb515898cbebe5f86dd9a25))
* Grid height in height restricted containers ([3d4d7a2](https://github.com/nu-grid/nu-grid-nuxt/commit/3d4d7a2218e0d62912c9d59b22c6160f0d8f9bb0))


### 🏡 Miscellaneous Chores

* Add sticky headers to docs ([184a6f1](https://github.com/nu-grid/nu-grid-nuxt/commit/184a6f1247842ec8b00fd4f1f56a709d0abc20c2))


### ♻️ Code Refactoring

* Rename props to clearer names ([72743c8](https://github.com/nu-grid/nu-grid-nuxt/commit/72743c82ca7ff40a5b12f704923017aa53e4e873))

## [0.2.0](https://github.com/nu-grid/nu-grid-nuxt/compare/v0.1.4...v0.2.0) (2026-01-29)


### ⚠ BREAKING CHANGES

* fix all broken imports

### 🏡 Miscellaneous Chores

* Fix all broken imports ([afccbca](https://github.com/nu-grid/nu-grid-nuxt/commit/afccbcaf0c7426ed8c84b26a451437be678511b9))
* Lockfile ([14ade51](https://github.com/nu-grid/nu-grid-nuxt/commit/14ade51d62ff1be7746aae9923cfc4add5e4420f))

## [0.1.4](https://github.com/nu-grid/nu-grid-nuxt/compare/v0.1.3...v0.1.4) (2026-01-29)


### 🏡 Miscellaneous Chores

* Update dependency to vueuse v14 ([014985b](https://github.com/nu-grid/nu-grid-nuxt/commit/014985b659ca7c7106d17a301e880551f4f20fe7))

## [0.1.3](https://github.com/nu-grid/nu-grid-nuxt/compare/v0.1.2...v0.1.3) (2026-01-29)


### 🏡 Miscellaneous Chores

* Fix css export ([960b8cb](https://github.com/nu-grid/nu-grid-nuxt/commit/960b8cb564bc37ad103f5cee2b9d1204566a5908))

## [0.1.2](https://github.com/nu-grid/nu-grid-nuxt/compare/v0.1.1...v0.1.2) (2026-01-27)


### 🏡 Miscellaneous Chores

* Fix pnpm publish ([09e2160](https://github.com/nu-grid/nu-grid-nuxt/commit/09e21608aac2bf6ea1b669f26951076521d1868f))

## [0.1.1](https://github.com/nu-grid/nu-grid-nuxt/compare/v0.1.0...v0.1.1) (2026-01-11)


### 🏡 Miscellaneous Chores

* Release 0.1.1 ([83924ed](https://github.com/nu-grid/nu-grid-nuxt/commit/83924ed57376209719d370c4b2d55b48088b9ace))

## [0.1.0](https://github.com/nu-grid/nu-grid-nuxt/compare/v0.1.0...v0.1.0) (2026-01-11)


### 🏡 Miscellaneous Chores

* Initial public release ([9dd0d03](https://github.com/nu-grid/nu-grid-nuxt/commit/9dd0d03abda92531a3530c2f1511a97fdff91d9d))

## [0.1.0](https://github.com/nu-grid/nu-grid-nuxt/compare/nu-grid-nuxt-v0.1.0...nu-grid-nuxt-v0.1.0) (2026-01-11)


### ⚠ BREAKING CHANGES

* initial public release

### ✨ Features

* Initial public release ([831cc1a](https://github.com/nu-grid/nu-grid-nuxt/commit/831cc1a51b7abe6431bacb912fc9b783a886cce4))


### 🏡 Miscellaneous Chores

* **main:** Release nuxt 0.1.0 ([#1](https://github.com/nu-grid/nu-grid-nuxt/issues/1)) ([50e05f5](https://github.com/nu-grid/nu-grid-nuxt/commit/50e05f5a9771b8ba4a9aac155af644e85f7d93d7))
* Update release-please ([3a4f444](https://github.com/nu-grid/nu-grid-nuxt/commit/3a4f444cbd1c9d6a7d70df3a67ad61cabc0f516c))

## 0.1.0 (2026-01-11)


### ⚠ BREAKING CHANGES

* initial public release

### ✨ Features

* Initial public release ([831cc1a](https://github.com/nu-grid/nu-grid-nuxt/commit/831cc1a51b7abe6431bacb912fc9b783a886cce4))
