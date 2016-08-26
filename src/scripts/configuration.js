VSS.init({                        
    explicitNotifyLoaded: true,
    usePlatformStyles: true
});

//Used like a dictionary
var subscriptionDefs = {};

//Used in combo boxes
function ComboElem (id, name) {
    this.id = id;
    this.name = name;

    this.toString = function() {
        return this.name;
    }
}

var types = {
    BUILD: "Build completions",
    GIT: "Code changes",
    WIT: "Work item changes",
    TFVC: "Code reviews",
    PR: "Pull requests"
};

//This top part before the first require statement is all about building the custom configuration options/dropdowns
function SubscriptionDivFactory() {
    
    var _makeBaseCombo = function(myContainer, additionalContainer, id) {
        VSS.require(["VSS/Controls", "VSS/Controls/Combos"], function(Controls, Combos) {
            var subData = {
                enabled: true,
                eventType: '',
                conditionOne: '',
                conditionTwo: '',
                conditionWhere: ''
            };
            subscriptionDefs[id] = subData;
            var makeOptions = {
                allowEdit: false,
                cssClass: 'bowtie dropdown event-dropdown',
                source: [types.BUILD, types.GIT, types.WIT, types.TFVC, types.PR],
                change: function () {
                    var selected = this.getText();
                    subscriptionDefs[id].eventType = selected;
                    $(additionalContainer).empty();
                    $(additionalContainer).append(additionalDropdown);
                    if (selected.indexOf("Build completions") === 0) {
                        new BuildCompletions(id).addCombos(additionalContainer);
                    } else if (selected.indexOf("Code changes") === 0) {
                        new CodeChanges(id).addCombos(additionalContainer);
                    } else if (selected.indexOf("Work item changes") === 0) {
                        new WorkItemChanges(id).addCombos(additionalContainer);
                    } else if (selected.indexOf("Code reviews") === 0) {
                        new CodeReviews(id).addCombos(additionalContainer);
                    } else if (selected.indexOf("Pull requests") === 0) {
                        new PullRequests(id).addCombos(additionalContainer);
                    }
                }
            };

            Controls.create(Combos.Combo, myContainer, makeOptions);
        })
    };
    
    var baseDiv =   '<div>' +
                    '   <div class="base-dropdown"></div>' +
                    '   <span onClick="toggleEdit(this)" class="bowtie-icon bowtie-edit disabled"></span>' +
                    '   <span onClick="deleteParent(this)" class="bowtie-icon bowtie-edit-delete"></span>' +
                    '   <div class="additional-container"></div>' +
                    '</div>';

    this.generateDiv = function() {
       var div = $.parseHTML(baseDiv);
       SubscriptionDivFactory.divID += 1
       $(div).attr("id", SubscriptionDivFactory.divID);
       var mainDiv = $(div).children().get(0);
       var additionalDiv = $(div).children().get(3);
       $(additionalDiv).attr("id", SubscriptionDivFactory.divID);
       _makeBaseCombo(mainDiv, additionalDiv, SubscriptionDivFactory.divID);
       $("#event-container").append(div);
    }
}

SubscriptionDivFactory.divID = -1;

var BuildCompletions = function(id) {
    this.id = id;
    var that = this;

    this.addCombos = function(container) {
        var mainSubContainer = $(container).children().get(0);
        VSS.require(["VSS/Controls", "VSS/Controls/Combos", "TFS/Core/RestClient", "TFS/Build/RestClient"], function(Controls, Combos, Client, SubClient) {
            Client.getClient().getProjects()
                .then(function(projects) {
                    var mySource = [];
                    projects.forEach(function(project) {
                        mySource.push(project.name);
                    });

                    var makeOptions = {
                        allowEdit: false,
                        cssClass: 'bowtie dropdown',
                        source: mySource,
                        change: function () {
                            var selected = this.getText();
                            SubClient.getClient().getDefinitions(selected)
                                .then(function(definitions) {
                                    var source = [];
                                    definitions.forEach(function(def) {
                                        source.push(new ComboElem(def.uri, def.name));
                                    });
                                    defCombo.setSource(source);
                                });
                        }
                    };

                    generateLabel("Project").appendTo(mainSubContainer);
                    Controls.create(Combos.Combo, mainSubContainer, makeOptions);
                    generateLabel("Build Definition").appendTo(mainSubContainer);
                    var defCombo = Controls.create(Combos.Combo, mainSubContainer, blankOptions);
                })
            });
        $(container).siblings('.bowtie-edit').removeClass('disabled');
        $(container).siblings('.bowtie-edit').addClass('edit');
        $(mainSubContainer).show();
    };
};

var CodeChanges = function(id) {
    this.id = id;
    var that = this;

    this.addCombos = function(container) {
        var mainSubContainer = $(container).children().get(0);
        VSS.require(["VSS/Controls", "VSS/Controls/Combos", "TFS/Core/RestClient", "TFS/VersionControl/GitRestClient"], function(Controls, Combos, Client, SubClient) {
            Client.getClient().getProjects()
                .then(function(references) {
                    var mySource = [];
                    references.forEach(function(reference) {
                        mySource.push(reference.name);
                    });
                    var makeOptions = {
                        allowEdit: false,
                        cssClass: 'bowtie dropdown',
                        source: mySource,
                        change: function () {
                            var selected = this.getText();
                            SubClient.getClient().getRepositories(selected)
                                .then(function(repos) {
                                    var source = [];
                                    repos.forEach(function(repo) {
                                        source.push(new ComboElem(repo.id, repo.name));
                                    });
                                    repoCombo.setSource(source);
                                });
                        }
                    };

                    generateLabel("Project").appendTo(mainSubContainer);
                    Controls.create(Combos.Combo, mainSubContainer, makeOptions);
                    generateLabel("Repository").appendTo(mainSubContainer);
                    var repoCombo = Controls.create(Combos.Combo, mainSubContainer, blankOptions);
                })
            });
        $(container).siblings('.bowtie-edit').removeClass('disabled');
        $(container).siblings('.bowtie-edit').addClass('edit');
        $(mainSubContainer).show();
    };
};

var WorkItemChanges = function(id) {
    this.id = id;
    var that = this;

    this.addCombos = function(container) {
        var mainSubContainer = $(container).children().get(0);
        VSS.require(["VSS/Controls", "VSS/Controls/Combos", "TFS/Core/RestClient", "TFS/WorkItemTracking/RestClient"], function(Controls, Combos, Client, SubClient) {
            Client.getClient().getProjects()
                .then(function(references) {
                    var mySource = [];
                    references.forEach(function(reference) {
                        mySource.push(reference.name);
                    });

                    var makeOptions = {
                        allowEdit: false,
                        cssClass: 'bowtie dropdown',
                        source: mySource,
                        change: function () {
                            var selected = this.getText();
                            SubClient.getClient().getRootNodes(selected)
                                .then(function(nodes) {
                                    var source = [];
                                    nodes.forEach(function(node) {
                                        source.push(new ComboElem(node.id, node.name));
                                    });
                                    nodeCombo.setSource(source);
                                });
                        }
                    };

                    generateLabel("Project").appendTo(mainSubContainer);
                    Controls.create(Combos.Combo, mainSubContainer, makeOptions);
                    generateLabel("Area Path").appendTo(mainSubContainer);
                    var nodeCombo = Controls.create(Combos.Combo, mainSubContainer, blankOptions);
                    generateLabel(defWhereLabel).appendTo(mainSubContainer);
                    Controls.create(Combos.Combo, mainSubContainer, whereOptions);
                })
            });
        $(container).siblings('.bowtie-edit').removeClass('disabled');
        $(container).siblings('.bowtie-edit').addClass('edit');
        $(mainSubContainer).show();
    };
};

var CodeReviews = function(id) {
    this.id = id;

    this.addCombos = function(container) {
        var mainSubContainer = $(container).children().get(0);
        VSS.require(["VSS/Controls", "VSS/Controls/Combos", "TFS/Core/RestClient", "TFS/WorkItemTracking/RestClient"], function(Controls, Combos, Client, SubClient) {
            Client.getClient().getProjects()
                .then(function(references) {
                    var mySource = [];
                    references.forEach(function(reference) {
                        mySource.push(reference.name);
                    });

                    var makeOptions = {
                        allowEdit: false,
                        cssClass: 'bowtie dropdown',
                        source: mySource,
                        change: function () {
                            var selected = this.getText();
                            SubClient.getClient().getRootNodes(selected)
                                .then(function(nodes) {
                                    var source = [];
                                    nodes.forEach(function(node) {
                                        source.push(new ComboElem(node.id, node.name));
                                    });
                                    nodeCombo.setSource(source);
                                });
                        }
                    };

                    generateLabel("Project").appendTo(mainSubContainer);
                    Controls.create(Combos.Combo, mainSubContainer, makeOptions);
                    generateLabel("Area Path").appendTo(mainSubContainer);
                    var nodeCombo = Controls.create(Combos.Combo, mainSubContainer, blankOptions);
                    generateLabel(defWhereLabel).appendTo(mainSubContainer);
                    Controls.create(Combos.Combo, mainSubContainer, whereOptions);
                })
            });
        $(container).siblings('.bowtie-edit').removeClass('disabled');
        $(container).siblings('.bowtie-edit').addClass('edit');
        $(mainSubContainer).show();
    };
}

var PullRequests = function(id) {
    this.id = id;
    var that = this;

    this.addCombos = function(container) {
        var mainSubContainer = $(container).children().get(0);
        VSS.require(["VSS/Controls", "VSS/Controls/Combos", "TFS/Core/RestClient", "TFS/VersionControl/GitRestClient"], function(Controls, Combos, Client, SubClient) {
            Client.getClient().getProjects()
                .then(function(references) {
                    var mySource = [];
                    references.forEach(function(reference) {
                        mySource.push(reference.name);
                    });

                    var projectOptions = {
                        allowEdit: false,
                        cssClass: 'bowtie dropdown',
                        source: mySource,
                        change: function () {
                            var selected = this.getText();
                            subscriptionDefs[that.id].conditionOne = selected;
                            SubClient.getClient().getRepositories(selected)
                                .then(function(repos) {
                                    var source = [];
                                    repos.forEach(function(repo) {
                                        source.push(new ComboElem(repo.id, repo.name));
                                    });
                                    repoCombo.setSource(source);
                                });
                        }
                    };

                    generateLabel("Project").appendTo(mainSubContainer);
                    Controls.create(Combos.Combo, mainSubContainer, makeOptions);
                    generateLabel("Repository").appendTo(mainSubContainer);
                    var repoCombo = Controls.create(Combos.Combo, mainSubContainer, blankOptions);
                })
            });
        $(container).siblings('.bowtie-edit').removeClass('disabled');
        $(container).siblings('.bowtie-edit').addClass('edit');
        $(mainSubContainer).show();
    };
}

VSS.require(["TFS/Dashboards/WidgetHelpers", "TFS/Chat/RestClient", "VSS/Context", "VSS/Controls", "VSS/Controls/Combos"], 
    function (WidgetHelpers, TFS_REST_Chat, Context, Controls, Combos) {
    VSS.register("FeedWidget.Configuration", function () {

        var subType = {
            TEAM_ROOM: "existing",
            CUSTOM: "new"
        };

        var instanceData = {
            room: null,
            theme: null
        };

        //There are three different settings update method because
        //certain things should only be updated at specific times.
        function updateRoomSettings(roomID, roomName) {
            instanceData.room = {
                id: roomID,
                name: roomName
            };
        }

        function updateThemeSettings(themeClass, themeName) {
            instanceData.theme = {
                class: themeClass,
                name: themeName
            };
        }

        function _dataToSettings() {
            return {
                data: JSON.stringify(instanceData)
            };
        }

        //Subscriptions copy the format of team room subscriptions
        var generateSubscriptions = function() {
            var teamSubscriber = Context.getDefaultWebContext().team.id;
            var roomAddress = instanceData.room.id;
            for(var id in subscriptionDefs) {
                var value = subscriptionDefs[id];
                if(!value.enabled) {
                    continue;
                }
                var eventType;
                var clauses = [];
                switch(value.eventType) {
                    case types.BUILD:
                        eventType = "BuildCompletedEvent";
                        clauses = [{
                                    fieldName: "tb1:Definition/@Uri",
                                    index: 1,
                                    logicalOperator: null,
                                    operator: '=',
                                    value: value.conditionTwo
                                }];
                        break;
                    //Should eventually distinguish between Git and TFVC repos to make GitPush or Checkin events
                    case types.GIT:
                        eventType = "GitPushEvent"
                        clauses = [{
                                        fieldName: "PushNotification/RepositoryId",
                                    index: 1,
                                    logicalOperator: null,
                                    operator: '=',
                                    value: value.conditionTwo
                                }];
                        break;
                    case types.WIT:
                        eventType = "WorkItemChangedEvent";
                        clauses = [{
                                    fieldName: "CoreFields/StringFields/Field[Name='Area Path']/NewValue",
                                    index: 1,
                                    logicalOperator: null,
                                    operator: '=',
                                    value: value.conditionTwo
                                },
                                {
                                    logicalOperator: "AND",
                                    index: 2,
                                    clauses: [{
                                        fieldName: "CoreFields/StringFields/Field[Name='State']/NewValue",
                                        index: 1,
                                        logicalOperator: null,
                                        operator: '<>',
                                        value: "CoreFields/StringFields/Field[Name='State']/OldValue"
                                    },
                                    {
                                        fieldName: "CoreFields/StringFields/Field[Name='Assigned To']/NewValue",
                                        index: 2,
                                        logicalOperator: null,
                                        operator: '<>',
                                        value: "CoreFields/StringFields/Field[Name='Assigned To']/OldValue"
                                    }]
                                }];
                        break;
                    case types.TFVC:
                        eventType = "CodeReviewChangedEvent";
                        clauses = [{
                                    fieldName: "SourceWorkItem/Revision",
                                    index: 1,
                                    logicalOperator: null,
                                    operator: '=',
                                    value: '1'
                                },
                                {
                                    fieldName: "Action",
                                    index: 2,
                                    logicalOperator: "AND",
                                    operator: '=',
                                    value: 'Requested'
                                },
                                {
                                    fieldName: "SourceWorkItem/AreaPath",
                                    index: 2,
                                    logicalOperator: "AND",
                                    operator: value.conditionWhere == "In area path" ? "=" : "under",
                                    value: value.conditionTwo
                                }];
                        break;
                    case types.PR:
                        eventType = "GitPullRequestEvent"
                        clauses = [{
                                    fieldName: "RepositoryId",
                                    index: 1,
                                    logicalOperator: null,
                                    operator: '=',
                                    value: value.conditionTwo
                                },
                                {
                                    fieldName: "EventTrigger",
                                    index: 2,
                                    logicalOperator: "AND",
                                    operator: '<>',
                                    value: 'PushNotification'
                                },
                                {
                                    fieldName: "EventTrigger",
                                    index: 3,
                                    logicalOperator: "AND",
                                    operator: '<>',
                                    value: 'ReviewersUpdateNotification'
                                }];
                        break;
                    default:
                        eventType = "";
                        break;
                }
                var subscription = {
                    channel: {
                        type: "ChatRoom",
                        address: roomAddress
                    },
                    subscriber: teamSubscriber,
                    //The transfer of description to classification is broken, so these subscription break team rooms
                    //However, they successfully receive events
                    description: '"isEnabled":true',
                    filter: {
                        eventType: eventType,
                        criteria: {
                            clauses: clauses
                        },
                        type: 'Expression'
                    }
                };
                var client = TFS_REST_Sub.getClient();
                client.createSubscription(subscription);
            }
        }

        var ExistingInputOption = function() {
            this.base = $("#existing");
            var that = this;
            
            this.load = function(data) {
                return TFS_REST_Chat.getClient().getAllRooms()
                    .then(function (query) {
                        var roomList = query.value;
                        var roomSource = [];
                        //The val is what the code uses, the text is what the user sees                    
                        for (var i = 0; i < query.count; i++) {
                            var room = roomList[i];
                            roomSource.push(new ComboElem(room.id, room.name));
                        }

                        var value = data && data.room ? data.room.name : "Please select a room";

                        var roomOptions = {
                            allowEdit: false,
                            cssClass: 'bowtie dropdown',
                            value: value,
                            source: roomSource,
                            change: function () {
                                var index = this.getSelectedIndex();
                                var source = this.getBehavior().getDataSource().getSource();
                                var room = source[index];
                                updateRoomSettings(room.id, room.name);
                                $(document).trigger("config-change");
                            }
                        };

                        //Remove when radio buttons return
                        generateLabel("Team Room").appendTo(that.base);
                        Controls.create(Combos.Combo, that.base, roomOptions);

                        return WidgetHelpers.WidgetStatusHelper.Success();
                    }, function (error) {                            
                        return WidgetHelpers.WidgetStatusHelper.Failure(error.message);
                    });
            }

            this.show = function() {
                this.base.show();
            }
            
            this.hide = function() {
                this.base.hide();
            }

            this.open = function() {
                this.base.show('slide', { direction: 'up' }, 150);
            }

            this.close = function() {
                this.base.hide();
            }
        }

        var NewInputOption = function() {
            this.base = $("#new");
            this.eventContainer = $("#event-container");
            this.add = $("#add");
            this.subFactory = new SubscriptionDivFactory();
            this._isActive = false;
            var that = this;

            this.add.on("click", function() {
                that.subFactory.generateDiv();
            });

            this.add.bind("keyup", function(e) {
                if(e.keyCode === 13) {
                    that.subFactory.generateDiv();
                }
            });

            this.show = function() {
                this._isActive = true;
                this.base.show();
            }

            this.hide = function() {
                this._isActive = false;
                this.base.hide();
            }

            this.open = function() {
                this._isActive = true;
                this.base.show('slide', { direction: 'up' }, 150);
            }

            this.close = function() {
                this._isActive = false;
                this.base.hide('slide', { direction: 'up' }, 150);
            }

            this.isActive = function() {
                return this._isActive;
            }
        }

        var Themes = function() {
            this.base = $("#themes");
            this.themeSource = [
                new ComboElem("default", "Team Rooms"),
                new ComboElem("candy", "Cotton Candy"),
                new ComboElem("coffee", "Coffee"),
                new ComboElem("metal", "Metallic"),
                new ComboElem("sunset", "Sunset"),
                new ComboElem("ocean", "Underwater")
            ];
            var that = this;

            this.load = function(data) {
                
                var value = data && data.theme ? data.theme.name : "Team Room";

                var themeOptions = {
                    allowEdit: false,
                    cssClass: 'bowtie dropdown',
                    value: value,
                    source: that.themeSource,
                    change: function () {
                        var index = this.getSelectedIndex();
                        var source = this.getBehavior().getDataSource().getSource();
                        var theme = source[index];
                        updateThemeSettings(theme.id, theme.name);
                        $(document).trigger("config-change");
                    }
                };

                generateLabel("Theme").appendTo(this.base);
                Controls.create(Combos.Combo, this.base, themeOptions)

            }
        }

        var exstInput;
        var newInput;
        var themes;

        var viewSelectRoom = function() {
            exstInput.show();
            newInput.hide();
        }

        var changeToSelectRoom = function() {
            exstInput.open();
            newInput.close();
        }

        var viewCreateRoom = function() {
            exstInput.hide();
            newInput.show();
        }

        var changeToCreateRoom = function() {
            exstInput.close();
            newInput.open();
        }

        var loadInitial = function() {
            viewSelectRoom();
            /*
            if(data == null || !data.inputType) {
                viewSelectRoom();
            } else if(data.inputType == "new") {
                viewCreateRoom();
            } else if(data.inputType == "existing") {
                viewSelectRoom();
            }
            */
        }
        
        var load = function (data) {
            if(data) {
                instanceData = data;
            }
            //loadInitial();
            themes.load(data);
            //This is returned because it calls a rest API, which dictates whether loading was a success or Failure
            //When subscriptions are retrieved for the configuration, the result of both promises must be returned
            return exstInput.load(data);
        }

        return {
            load: function (widgetSettings, widgetConfigurationContext) {
                var data = JSON.parse(widgetSettings.customSettings.data);

                exstInput = new ExistingInputOption();
                //newInput = new NewInputOption();
                themes = new Themes;
                load(data);

                $(document).on("config-change", function() {
                    var eventName = WidgetHelpers.WidgetEvent.ConfigurationChange;
                    var customSettings = _dataToSettings(instanceData);
                    var eventArgs = WidgetHelpers.WidgetEvent.Args(customSettings);
                    widgetConfigurationContext.notify(eventName, eventArgs);
                });

                //Handler for radio buttons
                $('input[type=radio][name=room]').on("change", function () {
                    var value = $(this).val();
                    if(value == "existing") {
                        changeToSelectRoom();
                    } else if(value == "new") {
                        changeToCreateRoom();
                    }
                });

                return WidgetHelpers.WidgetStatusHelper.Success();
            },
            onSave: function() {
                /*
                if(isNew) {
                    if(subscriptionDefs.length == 0) {
                        return WidgetHelpers.WidgetConfigurationSave.Invalid();
                    }
                    generateSubscriptions();
                }
                */
                var customSettings = _dataToSettings(instanceData);
                return WidgetHelpers.WidgetConfigurationSave.Valid(customSettings); 
            }
        }
    });
    VSS.notifyLoadSucceeded();
});