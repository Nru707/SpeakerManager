trigger SpeakerAssignmentTrigger on Speaker_Assignment__c (
    before insert,
    before update
) {
    SpeakerAssignmentTriggerHandler.run(
        Trigger.new,
        Trigger.isBefore,
        Trigger.isInsert || Trigger.isUpdate
    );
}
