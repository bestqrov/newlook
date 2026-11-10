import 'package:flutter/widgets.dart';

import '../api/client.dart';

/// Tiny i18n: Arabic (default, RTL) and French.
class S {
  const S(this.lang);
  final String lang;

  static S of(BuildContext context) => S(Localizations.localeOf(context).languageCode == 'fr' ? 'fr' : 'ar');

  String t(String key, [Map<String, Object?> args = const {}]) {
    final entry = strings[key];
    var s = entry?[lang] ?? entry?['ar'] ?? key;
    args.forEach((k, v) => s = s.replaceAll('{$k}', '$v'));
    return s;
  }

  String error(Object e) {
    if (e is ApiException) {
      if (strings.containsKey('err.${e.code}')) return t('err.${e.code}');
      if (e.status == 429) return t('err.rate');
    }
    return t('err.error');
  }

  String day(int weekday) => t('day.$weekday');
}

const strings = <String, Map<String, String>>{
  'app.name': {'ar': 'نيولوك', 'fr': 'NewLook'},
  'home.pro': {'ar': 'أنا مهني', 'fr': 'Espace pro'},
  'home.search': {'ar': 'قلّب على خدمة: فيد، صبغة، حمام…', 'fr': 'Chercher un service : dégradé, couleur, hammam…'},
  'home.allCities': {'ar': 'كل المدن', 'fr': 'Toutes les villes'},
  'home.all': {'ar': 'الكل', 'fr': 'Tout'},
  'home.availableNow': {'ar': 'فاضيين دابا', 'fr': 'Libres maintenant'},
  'home.empty': {'ar': 'ما لقينا والو بهاد الشروط.', 'fr': 'Aucun résultat pour ces critères.'},
  'home.from': {'ar': 'من {p} درهم', 'fr': 'dès {p} MAD'},
  'home.ticket': {'ar': 'عندك بلاصة فالصف عند {name}', 'fr': 'Vous êtes dans la file chez {name}'},
  'common.retry': {'ar': 'عاود', 'fr': 'Réessayer'},
  'common.min': {'ar': 'دقيقة', 'fr': 'min'},
  'common.mad': {'ar': 'درهم', 'fr': 'MAD'},
  'profile.directions': {'ar': 'خذني ليه', 'fr': 'Itinéraire'},
  'profile.call': {'ar': 'عيّط', 'fr': 'Appeler'},
  'profile.whatsapp': {'ar': 'واتساب', 'fr': 'WhatsApp'},
  'profile.waText': {'ar': 'سلام، بغيت ناخد موعد عند {name}.', 'fr': 'Bonjour, je voudrais un rendez-vous chez {name}.'},
  'profile.openUntil': {'ar': 'مفتوح حتى {t}', 'fr': 'Ouvert jusqu’à {t}'},
  'profile.closedOpens': {'ar': 'مسدود · كيحل {d} {t}', 'fr': 'Fermé · ouvre {d} à {t}'},
  'profile.noHours': {'ar': 'أوقات العمل غير محددة', 'fr': 'Horaires non renseignés'},
  'profile.services': {'ar': 'الخدمات والأسعار', 'fr': 'Prestations et tarifs'},
  'profile.prices': {'ar': 'الأسعار', 'fr': 'Tarifs'},
  'profile.noServices': {'ar': 'الخدمات غادي تزاد قريباً.', 'fr': 'Prestations bientôt disponibles.'},
  'profile.works': {'ar': 'آخر الأعمال', 'fr': 'Réalisations'},
  'profile.noWorks': {'ar': 'ما تنشرات حتى أعمال دابا.', 'fr': 'Pas encore de réalisations.'},
  'live.free': {'ar': 'فاضي دابا', 'fr': 'Libre maintenant'},
  'live.waiting': {'ar': '{n} فالانتظار ≈ {m} دقيقة', 'fr': '{n} en attente ≈ {m} min'},
  'live.busy': {'ar': 'مشغول دابا', 'fr': 'Occupé'},
  'live.quiet': {'ar': 'خاوي دابا', 'fr': 'Calme en ce moment'},
  'live.moderate': {'ar': 'متوسط دابا', 'fr': 'Affluence moyenne'},
  'live.crowded': {'ar': 'عامر دابا', 'fr': 'Très fréquenté'},
  'live.closed': {'ar': 'مسدود دابا', 'fr': 'Fermé maintenant'},
  'state.free': {'ar': '🟢 فاضي', 'fr': '🟢 Libre'},
  'state.busy': {'ar': '🟡 مشغول', 'fr': '🟡 Occupé'},
  'state.closed': {'ar': '🔴 مسدود', 'fr': '🔴 Fermé'},
  'state.quiet': {'ar': '🟢 خاوي', 'fr': '🟢 Calme'},
  'state.moderate': {'ar': '🟡 متوسط', 'fr': '🟡 Moyen'},
  'state.crowded': {'ar': '🔴 عامر', 'fr': '🔴 Bondé'},
  'aud.women': {'ar': '👩 نساء', 'fr': '👩 Femmes'},
  'aud.men': {'ar': '👨 رجال', 'fr': '👨 Hommes'},
  'aud.mixed': {'ar': '👨‍👩‍👧 عائلي', 'fr': '👨‍👩‍👧 Familles'},
  'aud.private': {'ar': '🔒 حمام خاص', 'fr': '🔒 Hammam privatif'},
  'sched.now': {'ar': 'دابا: {a} حتى {t}', 'fr': 'Maintenant : {a} jusqu’à {t}'},
  'sched.next': {'ar': 'من بعد: {a}', 'fr': 'Ensuite : {a}'},
  'sched.none': {'ar': 'ما كاين حتى فترة دابا', 'fr': 'Aucune séance en ce moment'},
  'sched.week': {'ar': 'جدول الأسبوع', 'fr': 'Planning de la semaine'},
  'ritual.title': {'ar': 'صاوب الطقس ديالك', 'fr': 'Composez votre rituel'},
  'ritual.total': {'ar': '{n} مراحل · {m} دقيقة · {p} درهم', 'fr': '{n} étapes · {m} min · {p} MAD'},
  'ritual.pick': {'ar': 'اختار الوقت', 'fr': 'Choisir l’horaire'},
  'bring.title': {'ar': 'شنو تجيب معاك', 'fr': 'À apporter'},
  'bring.available': {'ar': 'متوفر عندنا', 'fr': 'Disponible sur place'},
  'queue.title': {'ar': 'زيدني فالصف', 'fr': 'Rejoindre la file'},
  'queue.intro': {'ar': 'ما تحتاجش تتسنى فالمحل: دير سميتك وتبع النوبة ديالك من التطبيق.', 'fr': 'Inutile d’attendre sur place : inscrivez-vous et suivez votre tour ici.'},
  'queue.closed': {'ar': 'المحل مسدود دابا. الصف كيتحل غير ملي يكون مفتوح.', 'fr': 'Le salon est fermé. La file ouvre avec le salon.'},
  'queue.open': {'ar': 'شوف النوبة ديالي', 'fr': 'Voir ma position'},
  'queue.youAre': {'ar': 'نتا فالصف', 'fr': 'Votre position'},
  'queue.next': {'ar': 'نتا اللي جاي! سير للمحل.', 'fr': 'C’est bientôt vous ! Rendez-vous au salon.'},
  'queue.about': {'ar': 'تقريباً {m} دقيقة', 'fr': 'Environ {m} min'},
  'queue.leave': {'ar': 'خرجني من الصف', 'fr': 'Quitter la file'},
  'queue.served': {'ar': 'مرحبا بيك! وصلات نوبتك.', 'fr': 'Bienvenue ! C’est votre tour.'},
  'queue.left': {'ar': 'خرجتي من الصف.', 'fr': 'Vous n’êtes plus dans la file.'},
  'queue.none': {'ar': 'ما عندك حتى بلاصة فالصف.', 'fr': 'Vous n’êtes dans aucune file.'},
  'ticket.title': {'ar': 'النوبة ديالي', 'fr': 'Ma place'},
  'form.name': {'ar': 'اسمك', 'fr': 'Votre nom'},
  'form.phone': {'ar': 'الهاتف (06…)', 'fr': 'Téléphone (06…)'},
  'book.cta': {'ar': 'احجز موعدك', 'fr': 'Réserver'},
  'book.chooseAudience': {'ar': 'اختار نساء ولا رجال باش تبان الأوقات.', 'fr': 'Choisissez femmes ou hommes pour voir les horaires.'},
  'book.noSlots': {'ar': 'ما كاين حتى وقت متاح هاد النهار.', 'fr': 'Aucun horaire disponible ce jour-là.'},
  'book.cash': {'ar': 'الدفع كاش فالمحل بعد الخدمة.', 'fr': 'Paiement en espèces au salon après la prestation.'},
  'book.confirm': {'ar': 'تأكيد الحجز', 'fr': 'Confirmer'},
  'book.done': {'ar': 'توصل الطلب ديالك. المهني غادي يأكد ليك الموعد.', 'fr': 'Demande envoyée. Le professionnel va confirmer.'},
  'book.pickSlot': {'ar': 'اختار ساعة من الساعات المتاحة.', 'fr': 'Choisissez un horaire disponible.'},
  'book.change': {'ar': 'بدّل الخدمة', 'fr': 'Changer de prestation'},
  'pro.title': {'ar': 'فضاء المهنيين', 'fr': 'Espace pro'},
  'pro.email': {'ar': 'البريد الإلكتروني', 'fr': 'E-mail'},
  'pro.password': {'ar': 'كلمة المرور', 'fr': 'Mot de passe'},
  'pro.login': {'ar': 'دخول', 'fr': 'Se connecter'},
  'pro.mfa': {'ar': 'هاد الحساب ديال الإدارة. استعمل الموقع.', 'fr': 'Compte administrateur : utilisez le site.'},
  'pro.noBusiness': {'ar': 'ما عندكش نشاط مسجل. سجّلو من الموقع.', 'fr': 'Aucun établissement. Créez-le sur le site.'},
  'pro.openSite': {'ar': 'فتح الموقع', 'fr': 'Ouvrir le site'},
  'pro.status': {'ar': 'الحالة دابا', 'fr': 'Statut en direct'},
  'pro.queue': {'ar': 'الصف ({n})', 'fr': 'File ({n})'},
  'pro.queueEmpty': {'ar': 'ما كاين حتى واحد فالصف.', 'fr': 'Personne dans la file.'},
  'pro.served': {'ar': 'دخل', 'fr': 'Servi'},
  'pro.noShow': {'ar': 'ما جاش', 'fr': 'Absent'},
  'pro.bookings': {'ar': 'الحجوزات', 'fr': 'Réservations'},
  'pro.noBookings': {'ar': 'ما كاين حتى حجز.', 'fr': 'Aucune réservation.'},
  'pro.confirm': {'ar': 'تأكيد', 'fr': 'Confirmer'},
  'pro.cancel': {'ar': 'إلغاء', 'fr': 'Annuler'},
  'pro.done': {'ar': 'تم', 'fr': 'Terminé'},
  'pro.logout': {'ar': 'خروج', 'fr': 'Déconnexion'},
  'pro.editOnSite': {'ar': 'عدّل البروفايل فالموقع', 'fr': 'Modifier le profil sur le site'},
  'bstatus.pending': {'ar': 'فالانتظار', 'fr': 'En attente'},
  'bstatus.confirmed': {'ar': 'مؤكد', 'fr': 'Confirmé'},
  'bstatus.cancelled': {'ar': 'ملغى', 'fr': 'Annulé'},
  'bstatus.done': {'ar': 'تم', 'fr': 'Terminé'},
  'day.0': {'ar': 'الأحد', 'fr': 'dimanche'},
  'day.1': {'ar': 'الإثنين', 'fr': 'lundi'},
  'day.2': {'ar': 'الثلاثاء', 'fr': 'mardi'},
  'day.3': {'ar': 'الأربعاء', 'fr': 'mercredi'},
  'day.4': {'ar': 'الخميس', 'fr': 'jeudi'},
  'day.5': {'ar': 'الجمعة', 'fr': 'vendredi'},
  'day.6': {'ar': 'السبت', 'fr': 'samedi'},
  'err.network': {'ar': 'ما كاينش الأنترنيت. تأكد من الاتصال.', 'fr': 'Pas de connexion. Vérifiez Internet.'},
  'err.invalid_phone': {'ar': 'رقم الهاتف ماشي صحيح (مثال: 0612345678).', 'fr': 'Numéro invalide (ex. : 0612345678).'},
  'err.invalid_input': {'ar': 'تأكد من المعلومات اللي دخلتي.', 'fr': 'Vérifiez les informations saisies.'},
  'err.slot_unavailable': {'ar': 'هاد الوقت ما بقاش متاح. اختار وقت آخر.', 'fr': 'Ce créneau n’est plus disponible.'},
  'err.too_many_bookings': {'ar': 'عندك بزاف ديال الحجوزات المفتوحة بهاد الرقم.', 'fr': 'Trop de réservations en cours avec ce numéro.'},
  'err.audience_required': {'ar': 'اختار نساء ولا رجال.', 'fr': 'Choisissez femmes ou hommes.'},
  'err.already_in_queue': {'ar': 'هاد الرقم ديجا فالصف.', 'fr': 'Ce numéro est déjà dans une file.'},
  'err.closed_now': {'ar': 'المحل مسدود دابا.', 'fr': 'Le salon est fermé.'},
  'err.queue_full': {'ar': 'الصف عامر. عاود من بعد.', 'fr': 'La file est pleine. Réessayez plus tard.'},
  'err.invalid_credentials': {'ar': 'البريد الإلكتروني أو كلمة المرور غالطين.', 'fr': 'E-mail ou mot de passe incorrect.'},
  'err.account_locked': {'ar': 'الحساب تبلوكا 15 دقيقة بسبب محاولات كثيرة.', 'fr': 'Compte bloqué 15 minutes.'},
  'err.mfa_not_configured': {'ar': 'هاد الحساب ديال الإدارة. استعمل الموقع.', 'fr': 'Compte administrateur : utilisez le site.'},
  'err.not_found': {'ar': 'ما لقيناش هاد الصفحة.', 'fr': 'Introuvable.'},
  'err.rate': {'ar': 'بزاف ديال المحاولات. تسنى شوية وعاود.', 'fr': 'Trop de tentatives. Patientez un peu.'},
  'err.error': {'ar': 'وقع مشكل. عاود المحاولة.', 'fr': 'Une erreur est survenue. Réessayez.'},
};
