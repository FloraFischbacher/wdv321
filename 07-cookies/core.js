// It's become a trope for me to start by putting these functions ahead of
// everything else, hasn't it? :p

function elem(type, attrs = {}, children = null) {
    let node = document.createElement(type);

    if (node instanceof HTMLUnknownElement)
        throw new Error("Invalid element type!");

    if (Array.isArray(children)) {
        children.forEach(child => {
            if (child instanceof Node) node.appendChild(child);
        });
    } else if (children instanceof Node) node.appendChild(children);

    for (let attr of Object.keys(attrs)) {
        if (attr === "style") {
            for (let rule of Object.keys(attrs[attr])) {
                node.style.setProperty(rule, attrs[attr][rule]);
            }
        } else {
            node.setAttribute(attr, attrs[attr].toString());
        }
    }

    return node;
}

function text(str) {
    return document.createTextNode(str);
}

// The word "cookie" is starting to sound like a fake word after
// reading this much documentation about them. @_@

function parseDuration(duration) {
    let values = {
        second: (date, amount) =>
            date.setSeconds(date.getSeconds() + amount),
        minute: (date, amount) => 
            date.setSeconds(date.getSeconds() + amount),
        hour: (date, amount) => 
            date.setHours(date.getSeconds() + amount),
        day: (date, amount) => 
            date.setDate(date.getDate() + amount),
        week: (date, amount) => 
            date.setDate(date.getDate() + (amount * 7)),
        month: (date, amount) => 
            date.setMonth(date.getMonth() + amount),
        year: (date, amount) => 
            date.setFullYear(date.getFullYear() + amount),
    }

    let result = [];

    let current = {
        quantity: -1,
        method: null,
    }

    let token = {
        type: "number",
        value: "",
    };

    let isNumber = ch => !Number.isNaN(Number.parseInt(ch));
    let clearToken = () => {
        if (token.type == "number") {
            current.quantity = Number.parseInt(token.value);
            token = {
                type: "unit",
                value: "",
            }
        } else {
            if (current.quantity === -1) 
                throw new TypeError("Invalid duration string!");

            switch (token.value) {
                case "s":  current.method = values.second; break;
                case "m":  current.method = values.minute; break;
                case "h":  current.method = values.hour;   break;
                case "d":  current.method = values.day;    break;
                case "wk": current.method = values.week;   break;
                case "mo": current.method = values.month;  break;
                case "yr": current.method = values.year;   break;
                default:
                    throw new TypeError("Invalid duration string!");
            }

            result.push(current);

            current = {
                quantity: -1,
                method: null,
            };

            token = {
                type: "number",
                value: "",
            }
        }
    };

    for (let ch of duration) {
        if ((isNumber(ch) && token.type === "unit")
        || (!isNumber(ch) && token.type === "number")) {
            clearToken();
        }

        token.value += ch;
    }

    clearToken();

    if (result.length === 0) throw new TypeError("Invalid duration string!");

    let future = new Date(Date.now());
    for (let segment of result) {
        segment.method(future, segment.quantity);
    }

    return future;
}

// A simple wrapper to manage cookies. Essentially serves as a namespace 
// than a traditional class. I wanted to use the more modern Cookie Store API,
// but it would have *required* me to use HTTPS to have it working (and I
// didn't have the energy to try and set that up right now). 
class Cookie {
    static get(name) {
        let cookie = document.cookie.split(";")
            .find(element => element.trim().startsWith(name))
            ?.split("=")[1];
        return cookie;
    }

    static set(name, value, expires = "1y") {
        document.cookie = `${name}=${value}; Expires=${parseDuration(expires).toUTCString()};`;
    }

    static delete(name) {
        document.cookie = `${name}=; Max-Age=-99999999;`;
    }
}

function updateHits() {
    let display = document.getElementById("hits");

    let hitCount;

    let cookie = Cookie.get("hitCount");

    if (cookie == null) hitCount = 0;
    else hitCount = Number.parseInt(cookie);

    hitCount += 1;
    display.textContent = hitCount;

    Cookie.set("hitCount", hitCount, "1yr");
}

function addLoginPrompt() {    
    let nav = document.getElementsByTagName("nav")[0];
    let button = nav.querySelector(":scope > button");

    if (Cookie.get("authorizedUser") != null) {
        button.remove();
        return;
    }

    let prompts = elem("form", {
        method: "post",
        action: "#",
        id: "prompts",
        style: {
            display: "flex",
            width: "100%",
            "justify-content": "right",
            gap: "1em",
            padding: "0 0 1em 0",
        }
    }, [
        elem("article", {
            style: {
                flex: "0 1 0"
            }
        }, [
            elem("label", { for: "username-input" }, text("Username:")),
            elem("input", {
                type: "text",
                name: "username-input",
                id: "username-input",
                required: true,
            })
        ]),
        elem("article", {
            style: {
                flex: "0 1 0"
            }
        }, [
            elem("label", { for: "password-input" }, text("Password:")),
            elem("input", {
                type: "password",
                name: "password-input",
                id: "password-input",
                required: true,
            })
        ])
    ]);

    button.addEventListener("click", event => {
        let username = document.getElementById("username-input").value;
        let password = document.getElementById("password-input").value;

        login(username, password);
    });
    nav.after(prompts);
}

function login(username, password) {
    if (
        username in membersInfo
        && membersInfo[username].password === password
    ) {
        Cookie.set("authorizedUser", username, "12h");
        window.location.href = "./members.html";
    }
}

class Registration {
    name; email; phone; date;
    
    static nameCheck = /[0-9A-Za-z_]+/;

    get name() { return this.name; }
    get email() { return this.email; }
    get phone() { return this.phone; }
    get date() { return this.date; }

    // I would provide any more validations for email than the form
    // attribute, but that *really* needs to be done on the server's
    // end regardless.

    // Same goes for phone numbers, for that matter. But I've already
    // talked about how much using an existing library for this is
    // important, so I don't need to reiterate that point here. ^^

    constructor(name, email, phone, date = null) {
        this.name = name;
        this.email = email;
        this.phone = phone;

        this.date = date ?? Date.now();
        this.#store();
    }

    #store() {
        Registration.registrations.push(this);
        localStorage.setItem("registrations",
            JSON.stringify(Registration.registrations));
    }

    // I'd rather keep the list of registrations scoped to the class
    // they belong to, so let's store a static variable that will hold
    // an array of the instantiated registrations, loaded from and
    // saving to local storage as needed :)
    static registrations = [];

    static {
        // In this static block, which should run when the *class* is
        // defined as opposed to each object instantiation, I will
        // quickly try to acquire the existing registrations from
        // local storage and parse them to result in a set of existing
        // registration objects!

        let stored = localStorage.getItem("registrations");
        let parsed = JSON.parse(stored) ?? [];
        
        for (let registry of parsed) {
            let existing = new Registration(registry.name,
                registry.email, registry.phone, registry.date);
        }
    }
}

// The assignment page has a "YYYY" template year, so I just made sure to
// replace that with whatever the current year was.
function addCurrentYear() {
    let year = document.getElementById("year");
    year.textContent = `${new Date(Date.now()).getFullYear()}`;
}

function addRegistrationForm() {
    let form = document.getElementsByTagName("form")[0];
    form.replaceChildren();

    form.style.display = "flex";
    form.style.flexWrap = "wrap";
    form.style.gap = "1em";
    form.style.margin = "2em";
    form.style.width = "fit-content";

    let styles = {
        fields: {
            display: "flex",
            "flex-direction": "column",
            flex: "1 1 1",
            "gap": "0.5em",
            "justify-content": "center",
            "width": "100%",
        },

        inputs: {
            padding: "0.5em",
        },

        labels: {
            width: "100%",
            "font-size": "14pt",
            "font-style": "italic",
        }
    };

    let field = (id, label, type) => {
        return elem("article", {
            id: id.concat("-field"),
            style: styles.fields
        }, [
            elem("label", {
                id: id.concat("-label"),
                for: id.concat("-input"),
                style: styles.labels
            }, text(label)),

            elem("input", {
                id: id.concat("-input"),
                name: id.concat("-input"),
                type: type,
                style: styles.inputs
            })
        ]);
    };

    let name = field("name", "Name:", "text");
    let email = field("email", "Email Address:", "email");
    let phone = field("phone", "Phone Number:", "tel");

    [name, email, phone].forEach(e => {
        form.appendChild(e);
    });

    form.appendChild(elem("button", {
        id: "registerBtn",
        name: "registerBtn",
        type: "submit",
        style: {
            width: "100%",
            padding: "1em",
            "margin-top": "0.5em",
            "font-size": "14pt",
        }
    }, text("Register for the event!")))

    form.addEventListener("submit", event => {
        event.preventDefault();
        
        let submitted = {
            name: document.getElementById("name-input").value,
            email: document.getElementById("email-input").value,
            phone: document.getElementById("phone-input").value,
        }

        new Registration(submitted.name, submitted.email, submitted.phone);

        form.reset();
    });
}

// The original assignment did not specify that these members had
// passwords or other user information (as the assignment page implies).
// 
// Keeping this in mind, I expanded the member object to compare
// both usernames and passwords and added extra fields of information
// to the user accounts.
let membersInfo = {
    "A1D2C4": {
        // NOTE: Do not do this in real life!!! Beyond just storing a
        // password in plain-text, it's stored *inside the client-side
        // code*. It's a good thing this application is a demonstration
        // and not live code :)
        password: "frankenstein",
        // Our example character here is probably going to get
        // dictionary-attacked, unfortunately. :( Poor guy.
        info: {
            favorite: {
                title: "Snow Crash",
                author: "Neal Stephenson"
            },
            num_read: 10,
        }
    },

    "B2D4C6": {
        password: "aw9wArV40uyxR15WKxMD",
        // That one isn't too bad!
        info: {
            favorite: {
                title: "The Ones Who Walk Away From Omelas",
                author: "Ursula K. Le Guin"
            },
            num_read: 43,
        }
    },

    "B3C2D1": {
        password: "correct horse battery staple",
        // https://xkcd.com/936/
        info: {
            favorite: {
                title: "Cat's Cradle",
                author: "Kurt Vonnegut"
            },
            num_read: 25,
        }
    },
}

function checkUser() {
    let cookie = Cookie.get("authorizedUser");
    
    if (cookie == null || !(cookie in membersInfo))
        window.location.href = "./index.html";
}

function displayAuthButton() {
    let displayBtn = document.getElementById("display-button");

    displayBtn.addEventListener("click", () => {
        console.log(document.cookie);
    })
}

function deleteAuthButton() {
    let deleteBtn = document.getElementById("delete-button");

    deleteBtn.addEventListener("click", () => {
        Cookie.delete("authorizedUser");
        console.log(document.cookie);
        window.location.href = "./index.html";
    });
}

function populateMemberInfo() {
    let user = membersInfo[Cookie.get("authorizedUser")]?.info;

    let target = document.querySelector(".leftColumn > h3");
    let content = elem("article", {
        style: {
            border: "1px solid black",
            padding: "1em 1em 1em 0",
            margin: "1em"
        }
    }, elem("ul", {}, [
        elem("li", {}, [
            elem("strong", {}, text("Number of books read: ")),
            text(user.num_read)
        ]),
        elem("li", {}, [
            elem("strong", {}, text("Favorite book: ")),
            elem("em", {}, text(user.favorite.title)),
            text(" by " + user.favorite.author)
        ])
    ]));

    target.after(content);
}

function populateEventInfo() {
    let target = document.querySelector(".rightColumn");

    let rows = [];

    for (let header of ["Full Name", "Email Address", "Phone Number"]) {
        rows.push(elem("div", { style: { "font-weight": "bold" } }, text(header)));
    }

    for (let row of Registration.registrations) {
        rows.push(elem("div", {}, text(row.name)));
        rows.push(elem("div", {}, text(row.email)));
        rows.push(elem("div", {}, text(row.phone)));
    }

    let table = elem("div", {
        style: {
            border: "1px solid black",
            margin: "1em",
            display: "grid",
            "grid-template-columns": "repeat(3, 1fr)",
            "gap": "0.25em 1em",
        }
    }, rows)

    target.appendChild(table);
}