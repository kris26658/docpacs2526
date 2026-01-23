/*:
 * @Custom Controls Plugin
 * @plugindesc v1.0 - Adds a custom controls menu to configure key bindings for various actions.
 * 
 * @help
 * This plugin adds a new "Controls" option to both the title screen and the in-game menu.
 * In the Controls menu, players can customize key bindings for various actions such as movement,
 * interaction, and menu access.
 * 
 * The key bindings are saved in the game's configuration and persist across sessions.
 * To use the plugin, simply include it in your RPG Maker MV/MZ project.
 * 
 * No plugin commands are necessary.
 * 
 * @author kris26658
*/

(() => {
    const PLUGIN_NAME = "CustomControls";

    //-----------------------------------------------------------------------------
    // ConfigManager
    //
    // Adds custom controls to the existing config manager.

    ConfigManager._customCtrls = {};

    function ConfigManager() {
        throw new Error("This is a static class");
    }

    Object.defineProperty(ConfigManager, "customCtrls", {
        get: function () {
            return this._customCtrls;  // Return the internal variable
        },
        set: function (value) {
            this._customCtrls = value;  // Set the internal variable
            for (let action in this._customCtrls) {
                Input.keyMapper[action] = this._customCtrls[action];
            }
        },
        configurable: true
    });

    ConfigManager.load = function () {
        StorageManager.loadObject("config")
            .then(config => this.applyData(config || {}))
            .catch(() => 0)
            .then(() => {
                this._isLoaded = true;
                return 0;
            })
            .catch(() => 0);
    };

    ConfigManager.save = function () {
        StorageManager.saveObject("config", this.makeData());
    };

    ConfigManager.isLoaded = function () {
        return this._isLoaded;
    };

    ConfigManager.makeData = function () {
        const config = {};
        config.customCtrls = this.customCtrls;
        return config;
    };

    ConfigManager.applyData = function (config) {
        this.customCtrls = this.readObject(config, "customCtrls", {});
    };

    ConfigManager.readFlag = function (config, name, defaultValue) {
        if (name in config) {
            return !!config[name];
        } else {
            return defaultValue;
        }
    };

    ConfigManager.readVolume = function (config, name) {
        if (name in config) {
            return Number(config[name]).clamp(0, 100);
        } else {
            return 100;
        }
    };

    ConfigManager.readObject = function (config, name, defaultValue) {
        if (name in config) {
            return config[name];
        } else {
            return defaultValue;
        }
    };

    //-----------------------------------------------------------------------------
    // Scene_Controls
    //
    // The scene class of the controls screen.

    function Scene_Controls() {
        this.initialize(...arguments);
    }

    Scene_Controls.prototype = Object.create(Scene_MenuBase.prototype);
    Scene_Controls.prototype.constructor = Scene_Controls;

    Scene_Controls.prototype.initialize = function () {
        Scene_MenuBase.prototype.initialize.call(this);
    };

    Scene_Controls.prototype.create = function () {
        Scene_MenuBase.prototype.create.call(this);
        this.createControlsWindow();
    };

    Scene_Controls.prototype.terminate = function () {
        Scene_MenuBase.prototype.terminate.call(this);
        ConfigManager.save();
    };

    Scene_Controls.prototype.createControlsWindow = function () {
        const rect = this.controlsWindowRect();
        this._controlsWindow = new Window_Controls(rect);
        this._controlsWindow.setHandler("cancel", this.popScene.bind(this));
        this.addWindow(this._controlsWindow);
    };

    Scene_Controls.prototype.controlsWindowRect = function () {
        const n = Math.min(this.maxCommands(), this.maxVisibleCommands());
        const ww = 400;
        const wh = this.calcWindowHeight(n, true);
        const wx = (Graphics.boxWidth - ww) / 2;
        const wy = (Graphics.boxHeight - wh) / 2;
        return new Rectangle(wx, wy, ww, wh);
    };

    Scene_Controls.prototype.maxCommands = function () {
        // Increase this value when adding option items.
        return 7;
    };

    Scene_Controls.prototype.maxVisibleCommands = function () {
        return 12;
    };

    //-----------------------------------------------------------------------------
    // Scene_Title
    //
    // Adds controls to the existing title scene.

    Scene_Title.prototype.createCommandWindow = function () {
        const background = $dataSystem.titleCommandWindow.background;
        const rect = this.commandWindowRect();
        this._commandWindow = new Window_TitleCommand(rect);
        this._commandWindow.setBackgroundType(background);
        this._commandWindow.setHandler("newGame", this.commandNewGame.bind(this));
        this._commandWindow.setHandler("continue", this.commandContinue.bind(this));
        this._commandWindow.setHandler("options", this.commandOptions.bind(this));
        this._commandWindow.setHandler("controls", this.commandControls.bind(this));
        this.addWindow(this._commandWindow);
    };

    Scene_Title.prototype.commandControls = function () {
        this._commandWindow.close();
        SceneManager.push(Scene_Controls);
    };

    //-----------------------------------------------------------------------------
    // Scene_Menu
    //
    // Adds controls to the existing menu scene.

    Scene_Menu.prototype.createCommandWindow = function () {
        const rect = this.commandWindowRect();
        const commandWindow = new Window_MenuCommand(rect);
        commandWindow.setHandler("item", this.commandItem.bind(this));
        commandWindow.setHandler("skill", this.commandPersonal.bind(this));
        commandWindow.setHandler("equip", this.commandPersonal.bind(this));
        commandWindow.setHandler("status", this.commandPersonal.bind(this));
        commandWindow.setHandler("formation", this.commandFormation.bind(this));
        commandWindow.setHandler("options", this.commandOptions.bind(this));
        commandWindow.setHandler("controls", this.commandControls.bind(this));
        commandWindow.setHandler("save", this.commandSave.bind(this));
        commandWindow.setHandler("gameEnd", this.commandGameEnd.bind(this));
        commandWindow.setHandler("cancel", this.popScene.bind(this));
        this.addWindow(commandWindow);
        this._commandWindow = commandWindow;
    };

    Scene_Menu.prototype.commandControls = function () {
        SceneManager.push(Scene_Controls);
    };

    //-----------------------------------------------------------------------------
    // Window_Controls
    //
    // The window for changing various control settings.

    function Window_Controls() {
        this.initialize(...arguments);
    }

    Window_Controls.prototype = Object.create(Window_Command.prototype);
    Window_Controls.prototype.constructor = Window_Controls;

    Window_Controls.prototype.initialize = function (rect) {
        Window_Command.prototype.initialize.call(this, rect);
    };

    Window_Controls.prototype.makeCommandList = function () {
        this.addCommandOptions();
    };

    Window_Controls.prototype.getKeyName = function (keyCode) {
        const keyNames = {
            8: "Backspace",
            9: "Tab",
            13: "Enter",
            16: "Shift",
            17: "Ctrl",
            18: "Alt",
            19: "Pause",
            20: "Caps Lock",
            27: "Escape",
            32: "Space",
            33: "Page Up",
            34: "Page Down",
            35: "End",
            36: "Home",
            37: "Left Arrow",
            38: "Up Arrow",
            39: "Right Arrow",
            40: "Down Arrow",
            44: "Print Screen",
            45: "Insert",
            46: "Delete",
            48: "0",
            49: "1",
            50: "2",
            51: "3",
            52: "4",
            53: "5",
            54: "6",
            55: "7",
            56: "8",
            57: "9",
            65: "A",
            66: "B",
            67: "C",
            68: "D",
            69: "E",
            70: "F",
            71: "G",
            72: "H",
            73: "I",
            74: "J",
            75: "K",
            76: "L",
            77: "M",
            78: "N",
            79: "O",
            80: "P",
            81: "Q",
            82: "R",
            83: "S",
            84: "T",
            85: "U",
            86: "V",
            87: "W",
            88: "X",
            89: "Y",
            90: "Z",
            91: "Left Window",
            92: "Right Window",
            93: "Select",
            96: "Num 0",
            97: "Num 1",
            98: "Num 2",
            99: "Num 3",
            100: "Num 4",
            101: "Num 5",
            102: "Num 6",
            103: "Num 7",
            104: "Num 8",
            105: "Num 9",
            106: "Multiply",
            107: "Add",
            109: "Subtract",
            110: "Decimal Point",
            111: "Divide",
            112: "F1",
            113: "F2",
            114: "F3",
            115: "F4",
            116: "F5",
            117: "F6",
            118: "F7",
            119: "F8",
            120: "F9",
            121: "F10",
            122: "F11",
            123: "F12",
            144: "Num Lock",
            145: "Scroll Lock",
            186: "Semicolon",
            187: "Equal Sign",
            188: "Comma",
            189: "Dash",
            190: "Period",
            191: "Forward Slash",
            192: "Grave Accent",
            219: "Open Bracket",
            220: "Backslash",
            221: "Close Bracket",
            222: "Single Quote"
        };
        return keyNames[keyCode];
    };


    Window_Controls.prototype.addCommandOptions = function () {
        //actions, corresponding to the keys they're bound to
        this.addCommand("Move Up", "up")
        this.addCommand("Move Down", "down")
        this.addCommand("Move Left", "left")
        this.addCommand("Move Right", "right")
        this.addCommand("Ok/Interact", "ok")
        this.addCommand("Cancel", "cancel")
        this.addCommand("Dash", "shift")
        this.addCommand("Action Menu", "menu")
        this.addCommand("Page Up", "pageup")
        this.addCommand("Page Down", "pagedown")
        this.addCommand("Debug Menu", "debug")
    };

    Window_Controls.prototype.drawItem = function (index) {
        const title = this.commandName(index);
        const status = this.statusText(index);
        const rect = this.itemLineRect(index);
        const statusWidth = this.statusWidth();
        const titleWidth = rect.width - statusWidth;
        this.resetTextColor();
        this.changePaintOpacity(this.isCommandEnabled(index));
        this.drawText(title, rect.x, rect.y, titleWidth, "left");
        this.drawText(status, rect.x + titleWidth, rect.y, statusWidth, "right");
    };

    Window_Controls.prototype.statusWidth = function () {
        return 120;
    };

    Window_Controls.prototype.statusText = function (index) {
        const symbol = this.commandSymbol(index);
        const assignedKeys = [];

        for (let keyCode in Input.keyMapper) {
            if (ConfigManager.customCtrls[keyCode] === undefined && Input.keyMapper[keyCode] === symbol) {
                assignedKeys.push(this.getKeyName(keyCode));
            } else if (ConfigManager.customCtrls[keyCode] === symbol) {
                assignedKeys.push(this.getKeyName(keyCode));
            }
        };
        return assignedKeys.length > 0 ? assignedKeys.join(", ") : "Unassigned";
    };

    Window_Controls.prototype.changeValue = function (symbol, value) {
        const lastValue = this.getConfigValue(symbol);
        if (lastValue !== value) {
            this.setConfigValue(symbol, value);
            this.redrawItem(this.findSymbol(symbol));
            this.playCursorSound();
        }
    };

    Window_Controls.prototype.getConfigValue = function (symbol) {
        return ConfigManager[symbol];
    };

    Window_Controls.prototype.setConfigValue = function (symbol, volume) {
        ConfigManager[symbol] = volume;
    };

    //-----------------------------------------------------------------------------
    // Window_TitleCommand
    //
    // Adds controls to the existing title command window.

    Window_TitleCommand.prototype.makeCommandList = function () {
        const continueEnabled = this.isContinueEnabled();
        this.addCommand(TextManager.newGame, "newGame");
        this.addCommand(TextManager.continue_, "continue", continueEnabled);
        this.addCommand(TextManager.options, "options");
        this.addCommand("Controls", "controls");
    };

    Window_TitleCommand.prototype.addControlsCommand = function () {
        if (this.needsCommand("controls")) {
            const enabled = this.isControlsEnabled();
            this.addCommand("Controls", "controls", enabled);
        }
    };

    Window_TitleCommand.prototype.isControlsEnabled = function () {
        return true;
    };

    //-----------------------------------------------------------------------------
    // Window_MenuCommand
    //
    // Adds controls to the existing menu command window.

    Window_MenuCommand.prototype.makeCommandList = function () {
        this.addMainCommands();
        this.addFormationCommand();
        this.addOriginalCommands();
        this.addOptionsCommand();
        this.addControlsCommand();
        this.addSaveCommand();
        this.addGameEndCommand();
    };

    Window_MenuCommand.prototype.addControlsCommand = function () {
        if (this.needsCommand("controls")) {
            const enabled = this.isControlsEnabled();
            this.addCommand("Controls", "controls", enabled);
        }
    };

    Window_MenuCommand.prototype.isControlsEnabled = function () {
        return true;
    };

    console.log("Custom Controls Plugin Loaded");

})();