function FeedItemFactory() {
    this.dateProcessor = new DateCompare();

    this.renderContent = function (type, data, title, url, postedTime) {
        var item;

        if (type == "BuildCompletedEvent") {
            item = new BuildCompleted(data, url);
        } else if (type == "CheckinEvent") {
            item = new Checkin(data);
        } else if (type == "CodeReviewChangedEvent") {
            item = new CodeReviewChanged(data, title);
        } else if (type == "GitPullRequestEvent") {
            item = new GitPullRequest(data);
        } else if (type == "GitPushEvent") {
            item = new GitPush(data);
        } else if (type == "WorkItemChangedEvent") {
            item = new WorkItemChanged(data, url);
        }

        item.dateString = this.dateProcessor.dateToString(postedTime);

        return item;
    };
}

var formatName = function (name) {
    var finalFormat = name.trim();

    if (finalFormat.length > 54) {
        finalFormat = finalFormat.slice(0, 51) + "...";
    }

    return finalFormat;
};

//Part of the build completions option
var BuildCompleted = function (data, url) {
    this._processData = function (data) {
        var icon;
        if (data.buildStatus == "Succeeded") {
            icon = React.createElement(
                "span",
                { className: "build-status" },
                React.createElement("span", { className: "bowtie-icon bowtie-status-success-outline" }),
                data.buildStatus
            );
        } else {
            icon = React.createElement(
                "span",
                { className: "build-status" },
                React.createElement("span", { className: "bowtie-icon bowtie-status-failure-outline" }),
                data.buildStatus
            );
        }

        var content = React.createElement(
            "h4",
            null,
            "Build ",
            data.buildNumber,
            " requested for ",
            formatName(data.buildReason.requestedFor),
            " ",
            icon
        );

        return content;
    };
    this.tag = "build";
    this.icon = "build";
    this.header = React.createElement(
        "a",
        { href: url, target: "_blank" },
        React.createElement(
            "h4",
            null,
            "Build: ",
            data.buildNumber
        )
    );
    this.mContent = this._processData(data);
};

//Part of the Code changes option
var Checkin = function (data) {
    this.tag = "checkin code-change";
    this.icon = "tfvc-commit";
    this.header = React.createElement(
        "a",
        { href: data.url, target: "_blank" },
        React.createElement(
            "h4",
            null,
            "Changeset: ",
            data.comment
        )
    );
    this.mContent = React.createElement(
        "h4",
        null,
        formatName(data.committer.displayName),
        " checked in a Changeset."
    );
};

//Part of the Code reviews option
//Event payload doesn't have a link
var CodeReviewChanged = function (data, title) {
    this.tag = "code-review";
    this.icon = "tfvc-compare";
    this.header = React.createElement(
        "h4",
        null,
        data.workItemType,
        ": ",
        title
    );
    this.mContent = React.createElement(
        "h4",
        null,
        formatName(data.requestor),
        " created a ",
        data.workItemType,
        "."
    );
};

//Part of the Pull requests option
//Event payload doesn't have a link
var GitPullRequest = function (data) {
    this._processData = function (data) {
        var actionWord;
        if (data.eventTrigger == "PullRequestCreatedNotification") {
            actionWord = "created";
        } else if (data.eventTrigger == "StatusUpdateNotification") {
            actionWord = data.status.toLowerCase();
        } else if (data.eventTrigger == "ReviewerVoteNotification") {
            if (data.vote == "10") {
                actionWord = "approved";
            } else if (data.vote == "5") {
                actionWord = "approved and left suggestions for";
            } else if (data.vote == "0") {
                actionWord = "withdrew their feedback for";
            } else if (data.vote == "-5") {
                actionWord = "is waiting for the author in";
            } else if (data.vote == "-10") {
                actionWord = "rejected";
            }
        }

        var content = React.createElement(
            "h4",
            null,
            formatName(data.eventTriggeredBy),
            " ",
            actionWord,
            " a Pull request."
        );

        return content;
    };

    this.tag = "pull-request";
    this.icon = "tfvc-pull-request";
    this.header = React.createElement(
        "h4",
        null,
        "Pull Request: ",
        data.title
    );
    this.mContent = this._processData(data);
};

//Part of the Code changes option
var GitPush = function (data) {
    this._processData = function (data) {
        var content;

        if (data.totalCommits == 0) {
            content = React.createElement(
                "h4",
                null,
                formatName(data.pusherDisplayName),
                " deleted ",
                formatName(data.refName.slice(7)),
                " from the ",
                formatName(data.repositoryName),
                " repository."
            );
        } else {
            content = React.createElement(
                "h4",
                null,
                formatName(data.pusherDisplayName),
                " pushed ",
                data.totalCommits,
                "  commit(s) to ",
                formatName(data.refName.slice(7)),
                " in the ",
                formatName(data.repositoryName),
                " repository."
            );
        }

        return content;
    };
    this.tag = "push code-change";
    this.icon = "tfvc-commit";
    this.header = React.createElement(
        "a",
        { href: data.refUrl, target: "_blank" },
        React.createElement(
            "h4",
            null,
            "Branch: ",
            data.refName.slice(7)
        )
    );
    this.mContent = this._processData(data);
};

//Part of the Work item updates option
var WorkItemChanged = function (data, url) {
    this._processData = function (data, url) {
        var content;

        if (data.stateChangedValue != undefined && data.assignedToChangedValue != undefined) {
            if (data.assignedToChangedValue == "") {
                content = React.createElement(
                    "h4",
                    null,
                    formatName(data.changedBy),
                    " changed the state to to ",
                    data.stateChangedValue,
                    " and cleared the Assigned To field."
                );
            } else if (data.changedBy == data.assignedToChangedValue) {
                content = React.createElement(
                    "h4",
                    null,
                    formatName(data.changedBy),
                    " changed the state to ",
                    data.stateChangedValue,
                    " and assigned it to themself."
                );
            } else {
                content = React.createElement(
                    "h4",
                    null,
                    formatName(data.changedBy),
                    " changed the state to ",
                    data.stateChangedValue,
                    " and assigned it to ",
                    React.createElement(
                        "span",
                        { className: "italics" },
                        formatName(data.assignedToChangedValue)
                    ),
                    "."
                );
            }
        } else if (data.stateChangedValue != undefined) {
            if (data.isNewWorkItem) {
                content = React.createElement(
                    "h4",
                    null,
                    formatName(data.changedBy),
                    " created a ",
                    data.workItemType,
                    "."
                );
            } else {
                content = React.createElement(
                    "h4",
                    null,
                    formatName(data.changedBy),
                    " changed the state to ",
                    data.stateChangedValue,
                    "."
                );
            }
        } else if (data.assignedToChangedValue != undefined) {
            if (data.assignedToChangedValue == "") {
                content = React.createElement(
                    "h4",
                    null,
                    formatName(data.changedBy),
                    " cleared the Assigned To field."
                );
            } else if (data.changedBy == data.assignedToChangedValue) {
                content = React.createElement(
                    "h4",
                    null,
                    formatName(data.changedBy),
                    " assigned a ",
                    data.workItemType,
                    " to themself."
                );
            } else {
                content = React.createElement(
                    "h4",
                    null,
                    formatName(data.changedBy),
                    " assigned a ",
                    data.workItemType,
                    " to ",
                    formatName(data.assignedToChangedValue),
                    "."
                );
            }
        } else {
            content = React.createElement(
                "h4",
                null,
                "Error: Work item change not recognized."
            );
        }

        return content;
    };

    this.tag = "work-item";
    this.icon = "work-item";
    this.header = React.createElement(
        "a",
        { href: url, target: "_blank" },
        React.createElement(
            "h4",
            null,
            data.workItemType,
            ": ",
            data.title
        )
    );
    this.mContent = this._processData(data, url);
};

var FeedItem = React.createClass({
    displayName: "FeedItem",

    render: function () {
        return React.createElement(
            "li",
            { className: "feed-item " + this.props.tag },
            React.createElement(
                "div",
                { className: "message" },
                React.createElement(
                    "div",
                    { className: this.props.tag + " message-header " + this.props.theme },
                    React.createElement(
                        "div",
                        { className: "message-icon" },
                        React.createElement("span", { className: "bowtie-icon bowtie-" + this.props.icon })
                    ),
                    this.props.header
                ),
                React.createElement(
                    "div",
                    { className: "message-body" },
                    React.createElement(
                        "div",
                        { className: "message-rightside" },
                        React.createElement(
                            "p",
                            null,
                            this.props.date
                        )
                    ),
                    React.createElement(
                        "div",
                        { className: "message-content event-" + this.props.tag },
                        this.props.mContent
                    )
                )
            )
        );
    }
});

var FeedList = React.createClass({
    displayName: "FeedList",

    render: function () {
        var theme = this.props.theme;
        var factory = new FeedItemFactory();
        var feedNodes = this.props.data.map(function (message) {
            var contentObj = JSON.parse(message.content);
            var typeSpecifics = factory.renderContent(contentObj.type, contentObj.data, contentObj.title, contentObj.url, message.postedTime);
            return React.createElement(FeedItem, { date: typeSpecifics.dateString, tag: typeSpecifics.tag, header: typeSpecifics.header, icon: typeSpecifics.icon, mContent: typeSpecifics.mContent, key: message.id, theme: theme });
        });
        if (feedNodes.length == 0) {
            $("#no-items").show();
        }
        return React.createElement(
            "div",
            { id: "feed-list" },
            React.createElement(
                "ul",
                { id: "list" },
                feedNodes
            )
        );
    }
});

var FeedHeader = React.createClass({
    displayName: "FeedHeader",

    render: function () {
        return React.createElement(
            "div",
            { id: "feed-header" },
            React.createElement(
                "h1",
                { id: "header-text" },
                this.props.header
            )
        );
    }
});

var FeedFilterBar = React.createClass({
    displayName: "FeedFilterBar",

    handleChange: function (event) {
        var hasItems = false;
        var artifactType = event.target.value;
        if (artifactType == "all") {
            $("#list").children().show();
            hasItems = true;
        } else {
            $("#list").children().each(function () {
                if ($(this).hasClass(artifactType)) {
                    $(this).show();
                    hasItems = true;
                } else {
                    $(this).hide();
                }
            });
        }

        if (!hasItems) {
            $("#no-items").show();
        } else {
            $("#no-items").hide();
        }
    },
    render: function () {
        return React.createElement(
            "div",
            { id: "feed-filter-bar" },
            React.createElement(
                "select",
                { id: "filter", onChange: this.handleChange, defaultValue: "all" },
                React.createElement(
                    "option",
                    { value: "all", type: "button" },
                    "All"
                ),
                React.createElement(
                    "option",
                    { value: "build", type: "button" },
                    "Build completions"
                ),
                React.createElement(
                    "option",
                    { value: "code-change", type: "button" },
                    "Code changes"
                ),
                React.createElement(
                    "option",
                    { value: "work-item", type: "button" },
                    "Work item changes"
                ),
                React.createElement(
                    "option",
                    { value: "code-review", type: "button" },
                    "Code reviews"
                ),
                ">",
                React.createElement(
                    "option",
                    { value: "pull-request", type: "button" },
                    "Pull requests"
                )
            )
        );
    }
});

var FeedEmptyExp = React.createClass({
    displayName: "FeedEmptyExp",

    handleClick: function () {
        VSS.require("TFS/Dashboards/Services", function (Services) {
            Services.WidgetHostService.getService().then(function (widgetHostService) {
                widgetHostService.showConfiguration();
            });
        });
    },
    render: function () {
        //Because vertical alignment is a pain
        var sizeClass = "";
        switch (this.props.size) {
            case 2:
                sizeClass = "sm";
                break;
            case 3:
                sizeClass = "med";
                break;
            case 4:
                sizeClass = "lg";
                break;
            default:
                break;
        }

        if (this.props.type == "Unconfigured") {
            return React.createElement(
                "div",
                { id: "no-items", className: sizeClass },
                React.createElement("img", { src: "resources/img/unconfigured.svg" }),
                React.createElement(
                    "h2",
                    null,
                    "Your activity feed is empty."
                ),
                React.createElement(
                    "h2",
                    { className: "clickable", onClick: this.handleClick },
                    "Configure it now"
                )
            );
        } else if (this.props.type == "Empty filter") {
            return React.createElement(
                "div",
                { id: "no-items", className: sizeClass, hidden: "true" },
                React.createElement("img", { src: "resources/img/no_items_1.svg" }),
                React.createElement(
                    "h2",
                    null,
                    "No activities yet under this filter."
                )
            );
        } else {
            return React.createElement(
                "div",
                { id: "no-items", className: sizeClass },
                React.createElement("img", { src: "resources/img/no_items_2.svg" }),
                React.createElement(
                    "h2",
                    null,
                    "There's nothing to report yet."
                ),
                React.createElement(
                    "h2",
                    { className: "clickable", onClick: this.handleClick },
                    "Edit your settings"
                )
            );
        }
    }
});

var FeedComponent = React.createClass({
    displayName: "FeedComponent",

    render: function () {
        if (this.props.unconfigured == "true") {
            return React.createElement(
                "div",
                { className: "feed-component" },
                React.createElement(FeedHeader, { header: this.props.name }),
                React.createElement(FeedEmptyExp, { type: "Unconfigured", size: this.props.size, dashservices: this.props.services })
            );
        } else if (this.props.feedList.length == 0) {
            return React.createElement(
                "div",
                { className: "feed-component" },
                React.createElement(FeedHeader, { header: this.props.name }),
                React.createElement(FeedEmptyExp, { type: "No items", size: this.props.size, dashservices: this.props.services })
            );
        } else {
            return React.createElement(
                "div",
                { className: "feed-component" },
                React.createElement(FeedHeader, { header: this.props.name }),
                React.createElement(FeedFilterBar, null),
                React.createElement(FeedEmptyExp, { type: "Empty filter", size: this.props.size }),
                React.createElement(FeedList, { data: this.props.feedList, theme: this.props.theme, dashservices: this.props.services })
            );
        }
    }
});