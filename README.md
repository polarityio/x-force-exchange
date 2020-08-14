# Polarity X-Force Exchange Integration

![image](https://img.shields.io/badge/status-beta-green.svg)

| ![image](./assets/overlay.png) |
|---|
|*X-Force Exchange Example*|

## X-Force Exchange Integration Options

### Host

The host to use for the X-Force Exchange API.

### API Key

API key to use for authentication with X-Force Exchange.

### Password

Password to use for authentication with X-Force Exchange.

### Minimum Score

Minimum risk score necessary to display a matching entry (does not apply to malware/hash entities). Valid values are 0 to 10.

### Minimum Risk

Minimum risk level necessary to display a matching entry (only applies to malware/hash entities). Valid values are "low", "medium", and "high"

### Ignore List

This is an alternate option that can be used to specify domains or IPs that you do not want sent to X-Force Exchange. The data must specify the entire IP or domain to be blocked (e.g., www.google.com is treated differently than google.com).

### Ignore Domain Regex

Domains that match the given regex will not be looked up.

### Ignore IP Regex

IPs that match the given regex will not be looked up.

## Installation Instructions

Installation instructions for integrations are provided on the [PolarityIO GitHub Page](https://polarityio.github.io/).

## Polarity

Polarity is a memory-augmentation platform that improves and accelerates analyst decision making.  For more information about the Polarity platform please see: 

https://polarity.io/
