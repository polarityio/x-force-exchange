module.exports = {
    /**
     * Name of the integration which is displayed in the Polarity integrations user interface
     *
     * @type String
     * @required
     */
    name: "X-Force Exchange",
    /**
     * The acronym that appears in the notification window when information from this integration
     * is displayed.  Note that the acronym is included as part of each "tag" in the summary information
     * for the integration.  As a result, it is best to keep it to 4 or less characters.  The casing used
     * here will be carried forward into the notification window.
     *
     * @type String
     * @required
     */
    acronym: "XF",
    /**
     * Description for this integration which is displayed in the Polarity integrations user interface
     *
     * @type String
     * @optional
     */
    description: "IBM X-Force Exchange is a threat intelligence sharing platform enabling research on security threats, aggregation of intelligence, and collaboration with peers",
    entityTypes: ['IPv4', 'url', 'domain', 'hash'],
    /**
     * An array of style files (css or less) that will be included for your integration. Any styles specified in
     * the below files can be used in your custom template.
     *
     * @type Array
     * @optional
     */
    "styles": [
        "./styles/x-force-exchange.less"
    ],
    /**
     * Provide custom component logic and template for rendering the integration details block.  If you do not
     * provide a custom template and/or component then the integration will display data as a table of key value
     * pairs.
     *
     * @type Object
     * @optional
     */
    block: {
        component: {
            file: "./components/x-force-exchange-block.js"
        },
        template: {
            file: "./templates/x-force-exchange-block.hbs"
        }
    },
    summary: {
        component: {
            file: './components/x-force-exchange-summary.js'
        },
        template: {
            file: './templates/x-force-exchange-summary.hbs'
        }
    },
    request: {
        // Provide the path to your certFile. Leave an empty string to ignore this option.
        // Relative paths are relative to the x-force-exchange integration's root directory
        cert: '',
        // Provide the path to your private key. Leave an empty string to ignore this option.
        // Relative paths are relative to the x-force-exchange integration's root directory
        key: '',
        // Provide the key passphrase if required.  Leave an empty string to ignore this option.
        // Relative paths are relative to the x-force-exchange integration's root directory
        passphrase: '',
        // Provide the Certificate Authority. Leave an empty string to ignore this option.
        // Relative paths are relative to the x-force-exchange integration's root directory
        ca: '',
        // An HTTP proxy to be used. Supports proxy Auth with Basic Auth, identical to support for
        // the url parameter (by embedding the auth info in the uri)
        proxy: '',
        /**
         * If set to false, the integeration will ignore SSL errors.  This will allow the integration to connect
         * to the x-force-exchange without valid SSL certificates.  Please note that we do NOT recommending setting this
         * to false in a production environment.
         */
        rejectUnauthorized: true
    },
    logging: {
        // directory is relative to the this integrations directory
        // e.g., if the integration is in /app/polarity-server/integrations/virustotal
        // and you set directoryPath to be `integration-logs` then your logs will go to
        // `/app/polarity-server/integrations/integration-logs`
        // You can also set an absolute path.  If you set an absolute path you must ensure that
        // the directory you specify is writable by the `polarityd:polarityd` user and group.

        //directoryPath: '/var/log/polarity-integrations',
        level: 'info',  //trace, debug, info, warn, error, fatal
    },
    /**
     * Options that are displayed to the user/admin in the Polarity integration user-interface.  Should be structured
     * as an array of option objects.
     *
     * @type Array
     * @optional
     */
    options: [
        {
            key: "host",
            name: "X-Force Exchange Host",
            description: "The host to use for the X-Force Exchange API",
            default: "https://api.xforce.ibmcloud.com",
            type: "text",
            userCanEdit: false,
            adminOnly: true
        },
        {
            key: "apikey",
            name: "API Key",
            description: "API key to use for authentication with X-Force Exchange",
            default: "",
            type: "text",
            userCanEdit: true,
            adminOnly: false
        },
        {
            key: "password",
            name: "Password",
            description: "Password to use for authentication with X-Force Exchange",
            default: "",
            type: "password",
            userCanEdit: true,
            adminOnly: false
        },
        {
            key: "minimumScore",
            name: "Minimum Score",
            description: "Minimum risk score necessary to display a matching entry (does not apply to malware/hash entities). Valid values are 0 to 10.",
            default: 0,
            type: "number",
            userCanEdit: true,
            adminOnly: false
        },
        {
            key: 'minimumRisk',
            name: "Minimum Malware Risk",
            description: 'Minimum risk level necessary to display a matching entry (only applies to malware/hash entities).  Valid values are "low", "medium", and "high"',
            default: {
                value: 'low',
                display: 'Low'
            },
            type: 'select',
            options: [
                {
                    value: 'low',
                    display: 'Low'
                },
                {
                    value: 'medium',
                    display: 'Medium'
                },
                {
                    value: 'high',
                    display: 'High'
                }
            ],
            multiple: false,
            userCanEdit: true,
            adminOnly: false
        },
        {
            key: 'blocklist',
            name: 'Ignored List',
            description: 'Comma dThis is an alternate option that can be used to specify domains or IPs that you do not want sent to Farsight DNSDB. The data must specify the entire IP or domain to be blocked (e.g., www.google.com is treated differently than google.com).elimited List of domains and IPs that you never want to send to X-Force Exchange (private IP addresses are never sent)',
            default: '',
            type: 'text',
            userCanEdit: false,
            adminOnly: false
        },
        {
            key: 'domainBlocklistRegex',
            name: 'Ignored Domain Regex',
            description:
              'Domains that match the given regex will not be looked up.',
            default: '',
            type: 'text',
            userCanEdit: false,
            adminOnly: false
        },
        {
            key: 'ipBlocklistRegex',
            name: 'Ignore IP Regex',
            description: 'IPs that match the given regex will not be looked up.',
            default: '',
            type: 'text',
            userCanEdit: false,
            adminOnly: false
        }
    ]
};
