public with sharing class SpeakerController {

    // 🔍 Search Speakers
    @AuraEnabled(cacheable=true)
    public static List<Speaker__c> searchSpeakers(String name, String speciality) {

        if (!Schema.SObjectType.Speaker__c.isAccessible()) {
            throw new AuraHandledException('No access to Speaker records');
        }

        String nameLike = String.isBlank(name) ? null : '%' + name + '%';

        if (String.isBlank(nameLike) && String.isBlank(speciality)) {
            return [
                SELECT Id, Name, Email__c, Speciality__c, Bio__c
                FROM Speaker__c
                WITH SECURITY_ENFORCED
            ];
        }

        if (String.isNotBlank(nameLike) && String.isBlank(speciality)) {
            return [
                SELECT Id, Name, Email__c, Speciality__c, Bio__c
                FROM Speaker__c
                WHERE Name LIKE :nameLike
                WITH SECURITY_ENFORCED
            ];
        }

        if (String.isBlank(nameLike) && String.isNotBlank(speciality)) {
            return [
                SELECT Id, Name, Email__c, Speciality__c, Bio__c
                FROM Speaker__c
                WHERE Speciality__c = :speciality
                WITH SECURITY_ENFORCED
            ];
        }

        return [
            SELECT Id, Name, Email__c, Speciality__c, Bio__c
            FROM Speaker__c
            WHERE Name LIKE :nameLike
            AND Speciality__c = :speciality
            WITH SECURITY_ENFORCED
        ];
    }

    // 📅 Availability Check
    @AuraEnabled
    public static Boolean checkAvailability(Id speakerId, Date selectedDate) {

        if (!Schema.SObjectType.Speaker_Assignment__c.isAccessible()) {
            throw new AuraHandledException('No access to Speaker Assignments');
        }

        List<Speaker_Assignment__c> assignments = [
            SELECT Id
            FROM Speaker_Assignment__c
            WHERE Speaker__c = :speakerId
            AND Session__r.Session_Date__c = :selectedDate
            WITH SECURITY_ENFORCED
            LIMIT 1
        ];

        return assignments.isEmpty();
    }

    // 💾 Create Assignment
    @AuraEnabled
    public static void createAssignment(Id speakerId, Id sessionId) {

        if (!Schema.SObjectType.Speaker_Assignment__c.isCreateable()) {
            throw new AuraHandledException('No permission to create assignment');
        }

        Speaker_Assignment__c sa = new Speaker_Assignment__c(
            Speaker__c = speakerId,
            Session__c = sessionId
        );

        // Enforce FLS
        SObjectAccessDecision decision =
            Security.stripInaccessible(
                AccessType.CREATABLE,
                new List<SObject>{ sa }
            );

        List<SObject> safeRecords = decision.getRecords();

        if (!safeRecords.isEmpty()) {
            Database.insert(safeRecords, AccessLevel.USER_MODE);
        }
    }

    // 🔹 Get Speaker Details
    @AuraEnabled(cacheable=true)
    public static Speaker__c getSpeakerDetails(Id speakerId) {
        if (!Schema.SObjectType.Speaker__c.isAccessible()) {
            throw new AuraHandledException('No access to Speaker records');
        }

        return [
            SELECT Id, Name, Bio__c, Speciality__c
            FROM Speaker__c
            WHERE Id = :speakerId
            WITH SECURITY_ENFORCED
            LIMIT 1
        ];
    }
}
