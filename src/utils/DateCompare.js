function DateCompare() {

    this.getDateString = function(fullDateString) {
        return fullDateString.slice(fullDateString.indexOf(' ') + 1, fullDateString.lastIndexOf(' '));
    };

    this.getTimeString = function(hours, minutes) {
        if(minutes < 10) {
            minutes = "0" + minutes;
        }
        var meridian = "";
        if(hours < 12) {
            meridian = "am";
        } else {
            meridian = "pm";
        }

        if(hours % 12 == 0) {
            hours = 12;
        } else {
            hours = hours % 12;
        }

        return hours + ":" + minutes + " " + meridian;
    };

    this.dateToString = function(date) {
        var today = new Date();
        var tYear = today.getFullYear();
        var dYear = date.getFullYear();
        var tMonth = today.getMonth();
        var dMonth = date.getMonth();
        var tDate = today.getDate();
        var dDate = date.getDate();

        //Most of the calculation here is to determine "yesterday"
        //There may be a faster way, but I'm keeping it because it took an afternoon to write
        if(tMonth == dMonth && tYear == dYear) {
            if(tDate == dDate) {
                return this.getTimeString(date.getHours(), date.getMinutes());
            } else if(tDate == dDate + 1) {
                return "Yesterday";
            }
        } else if(tDate == 1) {
            var lastDayOfMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
            if(tYear == dYear + 1 && tMonth == 0 && dMonth == 11 && dDate == lastDayOfMonth[11]) {
                return "Yesterday";
            } else if(tYear == dYear && tMonth == dMonth + 1) {
                if(dMonth == 2 && dYear % 4 == 0 && dYear % 400 != 0) {
                    if(dDate == 29) {
                        return "Yesterday";
                    }
                } else if(dDate == lastDayOfMonth[dMonth]) {
                    return "Yesterday";
                }
            }
        }

        return this.getDateString(date.toDateString());
    };
}