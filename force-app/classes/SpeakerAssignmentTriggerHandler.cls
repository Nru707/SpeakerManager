public with sharing class SpeakerAssignmentHandler {

    public static void checkTimeConflicts(List<Speaker_Assignment__c> newAssignments) {

        if (newAssignments == null || newAssignments.isEmpty()) {
            return;
        }

        if (!Schema.sObjectType.Speaker_Assignment__c.isAccessible()
            || !Schema.sObjectType.Session__c.isAccessible()) {
            return;
        }

        Set<Id> speakerIds = new Set<Id>();
        Set<Id> sessionIds = new Set<Id>();

        collectIds(newAssignments, speakerIds, sessionIds);

        if (speakerIds.isEmpty() || sessionIds.isEmpty()) {
            return;
        }

        Map<Id, Session__c> sessionMap = fetchSessions(sessionIds);
        Map<Id, List<Speaker_Assignment__c>> existingMap =
            fetchExistingAssignments(speakerIds);

        validateConflicts(newAssignments, sessionMap, existingMap);
    }

    // ---------- Helper Methods ----------

    private static void collectIds(
        List<Speaker_Assignment__c> records,
        Set<Id> speakerIds,
        Set<Id> sessionIds
    ) {
        for (Speaker_Assignment__c sa : records) {
            if (sa.Speaker__c != null && sa.Session__c != null) {
                speakerIds.add(sa.Speaker__c);
                sessionIds.add(sa.Session__c);
            }
        }
    }

    private static Map<Id, Session__c> fetchSessions(Set<Id> sessionIds) {
        return new Map<Id, Session__c>([
            SELECT Id, Session_Date__c, Start_Time__c, End_Time__c
            FROM Session__c
            WHERE Id IN :sessionIds
        ]);
    }

    private static Map<Id, List<Speaker_Assignment__c>> fetchExistingAssignments(
        Set<Id> speakerIds
    ) {
        Map<Id, List<Speaker_Assignment__c>> result = new Map<Id, List<Speaker_Assignment__c>>();

        List<Speaker_Assignment__c> existing = [
            SELECT Id, Speaker__c,
                   Session__r.Session_Date__c,
                   Session__r.Start_Time__c,
                   Session__r.End_Time__c
            FROM Speaker_Assignment__c
            WHERE Speaker__c IN :speakerIds
        ];

        for (Speaker_Assignment__c sa : existing) {
            if (!result.containsKey(sa.Speaker__c)) {
                result.put(sa.Speaker__c, new List<Speaker_Assignment__c>());
            }
            result.get(sa.Speaker__c).add(sa);
        }

        return result;
    }

    private static void validateConflicts(
        List<Speaker_Assignment__c> newAssignments,
        Map<Id, Session__c> sessionMap,
        Map<Id, List<Speaker_Assignment__c>> existingMap
    ) {
        for (Speaker_Assignment__c sa : newAssignments) {
            Session__c newSession = sessionMap.get(sa.Session__c);
            if (newSession == null || !existingMap.containsKey(sa.Speaker__c)) {
                continue;
            }

            for (Speaker_Assignment__c existing : existingMap.get(sa.Speaker__c)) {
                if (existing.Id == sa.Id) {
                    continue;
                }

                Session__c exSession = existing.Session__r;

                if (exSession.Session_Date__c == newSession.Session_Date__c
                    && newSession.Start_Time__c < exSession.End_Time__c
                    && newSession.End_Time__c > exSession.Start_Time__c) {

                    sa.addError('Speaker is already booked for this time.');
                }
            }
        }
    }
}
