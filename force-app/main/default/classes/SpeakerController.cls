public with sharing class SpeakerController {

    //Search Speakers
    @AuraEnabled(cacheable=true)
    public static List<Speaker__c> searchSpeakers(String name, String speciality) {

        if (!Schema.SObjectType.Speaker__c.isAccessible()) {
            throw new AuraHandledException('No access to Speaker');
        }

        List<String> conditions = new List<String>();
        Map<String, Object> params = new Map<String, Object>();

        if (String.isNotBlank(name)) {
            conditions.add('Name LIKE :name');
            params.put('name', '%' + name + '%');
        }

        if (String.isNotBlank(speciality)) {
            conditions.add('Speciality__c = :speciality');
            params.put('speciality', speciality);
        }

        String soql = 'SELECT Id, Name, Email__c, Speciality__c FROM Speaker__c';
        if (!conditions.isEmpty()) {
            soql += ' WHERE ' + String.join(conditions, ' AND ');
        }

        return Database.queryWithBinds(soql, params, AccessLevel.USER_MODE);
    }

    // Speaker Details
    @AuraEnabled(cacheable=true)
    public static Speaker__c getSpeakerDetails(Id speakerId) {
        if (!Schema.SObjectType.Speaker__c.isAccessible()) {
            throw new AuraHandledException('No access to Speaker');
        }

        return [
            SELECT Id, Name, Bio__c, Speciality__c
            FROM Speaker__c
            WHERE Id = :speakerId
            WITH SECURITY_ENFORCED
            LIMIT 1
        ];
    }

    // Booked Dates for Calendar
    @AuraEnabled(cacheable=true)
    public static List<Date> getBookedDates(Id speakerId) {
        if (!Schema.SObjectType.Speaker_Assignment__c.isAccessible()) {
            throw new AuraHandledException('No access to Assignments');
        }

        List<Date> bookedDates = new List<Date>();
        List<Speaker_Assignment__c> assignments = [
            SELECT Session__r.Session_Date__c
            FROM Speaker_Assignment__c
            WHERE Speaker__c = :speakerId
            AND Session__r.Session_Date__c >= :Date.today()
            WITH SECURITY_ENFORCED
        ];

        for (Speaker_Assignment__c sa : assignments) {
            if (sa.Session__r.Session_Date__c != null) {
                bookedDates.add(sa.Session__r.Session_Date__c);
            }
        }
        return bookedDates;
    }

    //  Availability Check
    @AuraEnabled
    public static Boolean checkAvailability(Id speakerId, Date selectedDate) {
        if (!Schema.SObjectType.Speaker_Assignment__c.isAccessible()) {
            throw new AuraHandledException('No access to Assignments');
        }

        List<Speaker_Assignment__c> sa = [
            SELECT Id
            FROM Speaker_Assignment__c
            WHERE Speaker__c = :speakerId
            AND Session__r.Session_Date__c = :selectedDate
            WITH SECURITY_ENFORCED
            LIMIT 1
        ];

        return sa.isEmpty();
    }

    // Create Session
    @AuraEnabled
    public static Id createSession(Date sessionDate) {
        if (!Schema.SObjectType.Session__c.isCreateable()) {
            throw new AuraHandledException('No permission to create Session');
        }

        Session__c s = new Session__c(Session_Date__c = sessionDate);
        SObjectAccessDecision decision = Security.stripInaccessible(
            AccessType.CREATABLE,
            new List<SObject>{ s }
        );

        Database.insert(decision.getRecords(), AccessLevel.USER_MODE);
        return ((Session__c)decision.getRecords()[0]).Id;
    }

    // Create Assignment
    @AuraEnabled
    public static void createAssignment(Id speakerId, Id sessionId) {
        if (!Schema.SObjectType.Speaker_Assignment__c.isCreateable()) {
            throw new AuraHandledException('No permission to create assignment');
        }

        Speaker_Assignment__c sa = new Speaker_Assignment__c(
            Speaker__c = speakerId,
            Session__c = sessionId
        );

        SObjectAccessDecision decision = Security.stripInaccessible(
            AccessType.CREATABLE,
            new List<SObject>{ sa }
        );

        Database.insert(decision.getRecords(), AccessLevel.USER_MODE);
    }
}
