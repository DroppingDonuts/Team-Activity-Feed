function FeedItemFactory() {
    this.dateProcessor = new DateCompare();

    this.renderContent = function (type, data, title, url, postedTime) {
        var item;

        if(type == "BuildCompletedEvent") {
            item = new BuildCompleted(data, url);
        } else if(type == "CheckinEvent") {
            item = new Checkin(data);
        } else if(type == "CodeReviewChangedEvent") {
            item = new CodeReviewChanged(data, title);
        } else if(type == "GitPullRequestEvent") {
            item = new GitPullRequest(data);
        } else if(type == "GitPushEvent") {
            item = new GitPush(data);
        } else if(type == "WorkItemChangedEvent") {
            item = new WorkItemChanged(data, url);
        }

        item.dateString = this.dateProcessor.dateToString(postedTime)

        return item;
    }
}

var formatName = function(name) {
    var finalFormat = name.trim();

    if(finalFormat.length > 54) {
        finalFormat = finalFormat.slice(0, 51) + "...";
    }

    return finalFormat;
}

//Part of the build completions option
var BuildCompleted = function (data, url) {
    this._processData = function (data) {
        var icon;
        if(data.buildStatus == "Succeeded") {
            icon = <span className="build-status"><span className="bowtie-icon bowtie-status-success-outline"></span>{data.buildStatus}</span>;
        } else {
            icon = <span className="build-status"><span className="bowtie-icon bowtie-status-failure-outline"></span>{data.buildStatus}</span>;
        }

        var content = <h4>Build {data.buildNumber} requested for {formatName(data.buildReason.requestedFor)} {icon}</h4>;

        return content;
    }
    this.tag = "build";
    this.icon = "build";
    this.header = <a href={url} target="_blank"><h4>Build: {data.buildNumber}</h4></a>;
    this.mContent = this._processData(data);
};

//Part of the Code changes option
var Checkin = function (data) {
    this.tag = "checkin code-change"
    this.icon = "tfvc-commit";
    this.header = <a href={data.url} target="_blank"><h4>Changeset: {data.comment}</h4></a>;
    this.mContent = <h4>{formatName(data.committer.displayName)} checked in a Changeset.</h4>;
};

//Part of the Code reviews option
//Event payload doesn't have a link
var CodeReviewChanged = function (data, title) {
    this.tag = "code-review";
    this.icon = "tfvc-compare";
    this.header = <h4>{data.workItemType}: {title}</h4>
    this.mContent = <h4>{formatName(data.requestor)} created a {data.workItemType}.</h4>;
};

//Part of the Pull requests option
//Event payload doesn't have a link
var GitPullRequest = function (data) {
    this._processData = function (data) {
        var actionWord;
        if(data.eventTrigger == "PullRequestCreatedNotification") {
            actionWord = "created";
        } else if(data.eventTrigger == "StatusUpdateNotification") {
            actionWord = data.status.toLowerCase();
        } else if(data.eventTrigger == "ReviewerVoteNotification") {
            if(data.vote == "10") {
                actionWord = "approved";
            } else if(data.vote == "5") {
                actionWord = "approved and left suggestions for";
            } else if(data.vote == "0") {
                actionWord = "withdrew their feedback for";
            } else if(data.vote == "-5") {
                actionWord = "is waiting for the author in";
            } else if(data.vote == "-10") {
                actionWord = "rejected";
            }
        }

        var content = <h4>{formatName(data.eventTriggeredBy)} {actionWord} a Pull request.</h4>

        return content;
    };

    this.tag = "pull-request";
    this.icon = "tfvc-pull-request";
    this.header = <h4>Pull Request: {data.title}</h4>;
    this.mContent = this._processData(data);
};

//Part of the Code changes option
var GitPush = function (data) {
    this._processData = function(data) {
        var content;

        if(data.totalCommits == 0) {
            content = <h4>{formatName(data.pusherDisplayName)} deleted {formatName(data.refName.slice(7))} from the {formatName(data.repositoryName)} repository.</h4>;
        } else {
            content = <h4>{formatName(data.pusherDisplayName)} pushed {data.totalCommits}  commit(s) to {formatName(data.refName.slice(7))} in the {formatName(data.repositoryName)} repository.</h4>;
        }
        
        return content;
    };
    this.tag = "push code-change";
    this.icon = "tfvc-commit";
    this.header = <a href={data.refUrl} target="_blank"><h4>Branch: {data.refName.slice(7)}</h4></a>;
    this.mContent = this._processData(data);
};


//Part of the Work item updates option
var WorkItemChanged = function (data, url) {
    this._processData = function (data, url) {
        var content;

        if(data.stateChangedValue != undefined && data.assignedToChangedValue != undefined) {
            if(data.assignedToChangedValue == "") {
                content = <h4>{formatName(data.changedBy)} changed the state to to {data.stateChangedValue} and cleared the Assigned To field.</h4>
            } else if(data.changedBy == data.assignedToChangedValue) {
                content = <h4>{formatName(data.changedBy)} changed the state to {data.stateChangedValue} and assigned it to themself.</h4>
            } else {
                content = <h4>{formatName(data.changedBy)} changed the state to {data.stateChangedValue} and assigned it to <span className="italics">{formatName(data.assignedToChangedValue)}</span>.</h4>
            }
        } else if(data.stateChangedValue != undefined) {
            if(data.isNewWorkItem) {
                content = <h4>{formatName(data.changedBy)} created a {data.workItemType}.</h4>
            } else {
                content = <h4>{formatName(data.changedBy)} changed the state to {data.stateChangedValue}.</h4>
            }
        } else if(data.assignedToChangedValue != undefined) {
            if(data.assignedToChangedValue == "") {
                content = <h4>{formatName(data.changedBy)} cleared the Assigned To field.</h4>
            } else if(data.changedBy == data.assignedToChangedValue) {
                content = <h4>{formatName(data.changedBy)} assigned a {data.workItemType} to themself.</h4>
            } else {
                content = <h4>{formatName(data.changedBy)} assigned a {data.workItemType} to {formatName(data.assignedToChangedValue)}.</h4>
            }
        } else {
            content = <h4>Error: Work item change not recognized.</h4>
        }

        return content;
    };

    this.tag = "work-item";
    this.icon = "work-item";
    this.header = <a href={url} target="_blank"><h4>{data.workItemType}: {data.title}</h4></a>;
    this.mContent = this._processData(data, url);
};


var FeedItem = React.createClass({
    render: function() {
        return (
            <li className={"feed-item " + this.props.tag}>
                <div className="message">
                    <div className={this.props.tag + " message-header " + this.props.theme}>
                        <div className="message-icon">
                            <span className={"bowtie-icon bowtie-" + this.props.icon}></span>
                        </div>
                        {this.props.header}
                    </div>
                    <div className="message-body">
                        <div className="message-rightside">
                            <p>{this.props.date}</p>
                        </div>
                        <div className={"message-content event-" + this.props.tag}>{this.props.mContent}</div>
                    </div>
                </div>
            </li>
        )
    }
});

var FeedList = React.createClass({
    render: function() {
        var theme = this.props.theme;
        var factory = new FeedItemFactory();
        var feedNodes = this.props.data.map(function(message) {
            var contentObj = JSON.parse(message.content);
            var typeSpecifics = factory.renderContent(contentObj.type, contentObj.data, contentObj.title, contentObj.url, message.postedTime);
            return (
                <FeedItem date={typeSpecifics.dateString} tag={typeSpecifics.tag} header={typeSpecifics.header} icon={typeSpecifics.icon} mContent={typeSpecifics.mContent} key={message.id} theme={theme}/>
            )
        });
        if(feedNodes.length == 0) {
            $("#no-items").show();
        }
        return (
            <div id="feed-list">
                <ul id="list">
                    {feedNodes}
                </ul>
            </div>
        )
    }
});

var FeedHeader = React.createClass ({
    render: function() {
        return (
            <div id="feed-header">
                <h1 id="header-text">
                    {this.props.header}
                </h1>
            </div>
        )
    }
});

var FeedFilterBar = React.createClass({
    handleChange: function(event) {
        var hasItems = false;
        var artifactType = event.target.value;
        if(artifactType == "all") {
            $("#list").children().show();
            hasItems = true;
        } else {
            $("#list").children().each(function() {
                if($(this).hasClass(artifactType)) {
                    $(this).show();
                    hasItems = true;
                } else {
                    $(this).hide();
                }
            });
        }

        if(!hasItems) {
            $("#no-items").show();
        } else {
            $("#no-items").hide();
        }
    },
    render: function() {
        return (
            <div id="feed-filter-bar">
                <select id="filter" onChange={this.handleChange} defaultValue="all">
                    <option value="all" type="button">All</option>
                    <option value="build" type="button">Build completions</option>
                    <option value="code-change" type="button">Code changes</option>
                    <option value="work-item" type="button">Work item changes</option>
                    <option value="code-review" type="button">Code reviews</option>>
                    <option value="pull-request" type="button">Pull requests</option>
                </select>
            </div>
        )
    }
});

var FeedEmptyExp = React.createClass({
    handleClick: function() {
        VSS.require("TFS/Dashboards/Services", function(Services) {
            Services.WidgetHostService.getService()
                .then(function (widgetHostService) {
                    widgetHostService.showConfiguration();
                });
        });
    },
    render: function() {
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

        if(this.props.type == "Unconfigured") {
            return (
                <div id="no-items" className={sizeClass}>
                    <img src="resources/img/unconfigured.svg"/>
                    <h2>Your activity feed is empty.</h2>
                    <h2 className="clickable" onClick={this.handleClick}>Configure it now</h2>
                </div>
            )
        } else if(this.props.type == "Empty filter") {
            return (
                <div id="no-items" className={sizeClass} hidden="true">
                    <img src="resources/img/no_items_1.svg"/>
                    <h2>No activities yet under this filter.</h2>
                </div>
            )
        }
        else {
            return (
                <div id="no-items" className={sizeClass}>
                    <img src="resources/img/no_items_2.svg"/>
                    <h2>There's nothing to report yet.</h2>
                    <h2 className="clickable" onClick={this.handleClick}>Edit your settings</h2>
                </div>
            )
        }
    }
});

var FeedComponent = React.createClass ({
    render: function() {
        if(this.props.unconfigured == "true") {
            return (
                <div className="feed-component">
                    <FeedHeader header={this.props.name}/>
                    <FeedEmptyExp type="Unconfigured" size={this.props.size} dashservices={this.props.services}/>
                </div>
            )
        } else if(this.props.feedList.length == 0) {
            return (
                <div className="feed-component">
                    <FeedHeader header={this.props.name}/>
                    <FeedEmptyExp type="No items" size={this.props.size} dashservices={this.props.services}/>
                </div>
            )
        } else {
            return (
                <div className="feed-component">
                    <FeedHeader header={this.props.name}/>
                    <FeedFilterBar/>
                    <FeedEmptyExp type="Empty filter" size={this.props.size}/>
                    <FeedList data={this.props.feedList} theme={this.props.theme} dashservices={this.props.services}/>
                </div>
            )
        }
    }
});