<x-mail::message>
<div dir="rtl" style="text-align: right;">

# مرحباً،

أرسل لك **{{ $senderName }}** المستند التالي من نظام **روائس** للأرشفة:

<x-mail::panel>
**📄 {{ $document->title }}**

@if($document->document_number)
- **رقم الوثيقة:** {{ $document->document_number }}
@endif
@if($document->documentType)
- **النوع:** {{ $document->documentType->name }}
@endif
@if($document->sector)
- **القطاع:** {{ $document->sector->name }}
@endif
@if($document->issuing_entity)
- **الجهة المصدرة:** {{ $document->issuing_entity }}
@endif
@if($document->issue_date)
- **تاريخ الإصدار:** {{ $document->issue_date->format('Y-m-d') }}
@endif
@if($document->expiry_date)
- **تاريخ الانتهاء:** {{ $document->expiry_date->format('Y-m-d') }}
@endif
</x-mail::panel>

@if($note)
**رسالة المرسل:**

> {{ $note }}
@endif

📎 المستند مرفق مع هذه الرسالة.

---

<small style="color: #888;">
هذه الرسالة أُرسلت من نظام روائس للأرشفة الإلكترونية.<br>
الرجاء عدم الرد على هذا البريد إذا لم تكن المستلم المقصود.
</small>

</div>
</x-mail::message>
