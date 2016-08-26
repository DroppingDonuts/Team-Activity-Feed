const additionalDropdown = '<div class="additional-dropdown"></div>';

var blankOptions = {
        allowEdit: false,
        cssClass: 'bowtie dropdown',
        change: function () {
            var index = this.getSelectedIndex();
            var source = this.getBehavior().getDataSource().getSource();
            var identity = source[index].id;
            subscriptionDefs[$(this._element.context).parent().parent().attr("id")].conditionTwo = identity;
            $(document).trigger("config-change");
    }
};

const defWhereLabel = "Event Location";

const whereOptions = {
    allowEdit: false,
    cssClass: 'bowtie dropdown',
    source: ["Under area path", "In area path"],
    change: function () {
        var selected = this.getText();
        subscriptionDefs[$(this._element.context).parent().parent().attr("id")].conditionWhere = selected;
    }
};

function generateLabel(text) {
    return $("<label />").addClass("option-label").text(text);
}

function toggleEdit(elem) {
    if($(elem).hasClass("disabled")) {
        return;
    }
    $(elem).toggleClass('edit');
    $(elem).siblings(".additional-container").toggle();
}

function deleteParent(elem) {
    var parent = $(elem).parent();
    var id = parent.attr('id');
    subscriptionDefs[id].enabled = false;
    parent.remove();
}