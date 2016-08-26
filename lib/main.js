VSS.init({
    explicitNotifyLoaded: true,
    usePlatformStyles: true
});

var gitClient;
VSS.require(["TFS/Dashboards/WidgetHelpers", "TFS/Chat/RestClient", "TFS/VersionControl/GitRestClient", "TFS/Dashboards/Services"], function (WidgetHelpers, TFS_Wit_ChatApi, TFS_Wit_GitApi, Services) {
    var defaultTheme = "default";
    var notification = 2;

    var unconfigExperience = '<img src="resources/img/no_items_2.svg"/>' + "<h2>There's nothing to report yet.</h2>" + '<h2>Fine tune your settings</h2>';

    gitClient = TFS_Wit_GitApi.getClient();
    WidgetHelpers.IncludeWidgetStyles();

    var _loadWidget = function (widgetSettings) {
        var data = JSON.parse(widgetSettings.customSettings.data);

        var theme;
        if (!data || !data.theme) {
            theme = defaultTheme;
        } else {
            theme = data.theme.class;
        }

        if (!data || !data.room || data.room.id == "") {
            ReactDOM.render(React.createElement(FeedComponent, { unconfigured: "true", name: widgetSettings.name, size: widgetSettings.size.rowSpan, services: Services }), document.getElementById('content'));
            return WidgetHelpers.WidgetStatusHelper.Success();
        } else {
            var filter = _getDateFilter();
            return TFS_Wit_ChatApi.getClient().getAllChatRoomMessages(data.room.id, filter).then(function (messages) {
                ReactDOM.render(React.createElement(FeedComponent, { unconfigured: "false", feedList: messages.filter(_filterByType).reverse(), name: widgetSettings.name, size: widgetSettings.size.rowSpan, theme: theme, services: Services }), document.getElementById('content'));
                return WidgetHelpers.WidgetStatusHelper.Success();
            }, function (error) {
                return WidgetHelpers.WidgetStatusHelper.Failure(error.message);
            });
        }
    };

    var _getDateFilter = function () {
        var today = new Date();
        today.setDate(today.getDate() - 29);
        return "postedtime ge " + (today.getMonth() + 1) + "/" + today.getDate() + "/" + today.getFullYear();
    };

    var _filterByType = function (message) {
        return message.messageType == notification;
    };

    VSS.register("FeedWidget", function () {
        return {
            load: function (widgetSettings) {
                return _loadWidget(widgetSettings);
            },
            reload: function (widgetSettings) {
                return _loadWidget(widgetSettings);
            }
        };
    });
    VSS.notifyLoadSucceeded();
});