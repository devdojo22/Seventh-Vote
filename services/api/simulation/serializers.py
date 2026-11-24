"""M4/05: the agenda item sent to POST /api/simulations."""

from rest_framework import serializers

from ai.llm import DISTRICT_IMPACTS, FISCAL_IMPACTS


class AgendaContextSerializer(serializers.Serializer):
    """Item details from the Session form. All optional: the Prep page sends none of them."""

    actionType = serializers.CharField(required=False, allow_blank=True, max_length=200)
    fiscalImpact = serializers.ChoiceField(required=False, choices=list(FISCAL_IMPACTS))
    mayorPriority = serializers.BooleanField(required=False)
    districtImpact = serializers.ChoiceField(required=False, choices=list(DISTRICT_IMPACTS))
    districts = serializers.ListField(
        required=False, child=serializers.CharField(max_length=100), max_length=50
    )
    committee = serializers.CharField(required=False, allow_blank=True, max_length=300)
    committeeChair = serializers.CharField(required=False, allow_blank=True, max_length=300)

    def validate(self, data):
        specific = data.get("districtImpact") == "specific"
        if specific and not data.get("districts"):
            raise serializers.ValidationError({"districts": "Choose the affected districts."})
        if "districts" in data and not specific:
            raise serializers.ValidationError(
                {"districts": "Districts only apply when the district impact is specific seats."}
            )
        return data


class AgendaSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=500, error_messages={"blank": "Add an agenda item with a title."})
    description = serializers.CharField(
        max_length=20000, error_messages={"blank": "Add a description of the agenda item."}
    )
    category = serializers.CharField(required=False, allow_blank=True, max_length=200)
    ask = serializers.CharField(required=False, allow_blank=True, max_length=100)
    context = AgendaContextSerializer(required=False)
