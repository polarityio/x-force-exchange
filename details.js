module.exports = class Details {
    constructor() {
        this.titledProperties = [];
        this.headerLists = [];
        this.tags = [];
        this.summary = [];
    }

    addHeaderList(header, item) {
        let done = false;
        this.headerLists.forEach((entry) => {
            if (entry.header === header) {
                entry.items.push(item);
                done = true;
            }
        });

        if (!done) {
            this.headerLists.push(
                {
                    header: header,
                    items: [item]
                });
        }
    }

    addTag(tag) {
        this.tags.push(tag);
    }

    addSummary(summary) {
        this.summary.push(summary);
    }

    addTitledProperty(title, property) {
        this.titledProperties.push({
            key: title,
            value: property
        })
    }
};
