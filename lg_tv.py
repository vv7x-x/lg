from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
import json
import os
import logging
from pywebostv.discovery import *
from pywebostv.connection import *
from pywebostv.controls import *

# إعداد التسجيل
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

lg_tv_bp = Blueprint('lg_tv', __name__)

# متغيرات عامة لحفظ حالة الاتصال
tv_client = None
tv_store = {}
store_file = 'tv_store.json'

def load_store():
    """تحميل بيانات المصادقة المحفوظة"""
    global tv_store
    try:
        if os.path.exists(store_file):
            with open(store_file, 'r') as f:
                tv_store = json.load(f)
                logger.info("تم تحميل بيانات المصادقة المحفوظة")
        else:
            tv_store = {}
            logger.info("لا توجد بيانات مصادقة محفوظة، سيتم إنشاء جديدة")
    except Exception as e:
        logger.error(f"خطأ في تحميل بيانات المصادقة: {e}")
        tv_store = {}

def save_store():
    """حفظ بيانات المصادقة"""
    global tv_store
    try:
        with open(store_file, 'w') as f:
            json.dump(tv_store, f)
        logger.info("تم حفظ بيانات المصادقة")
    except Exception as e:
        logger.error(f"خطأ في حفظ بيانات المصادقة: {e}")

def connect_to_tv(ip_address=None):
    """الاتصال بالتلفزيون"""
    global tv_client, tv_store
    
    try:
        load_store()
        
        if ip_address:
            # الاتصال بعنوان IP محدد
            tv_client = WebOSClient(ip_address)
        else:
            # البحث عن التلفزيون في الشبكة
            logger.info("جاري البحث عن تلفزيونات LG في الشبكة...")
            discovered_tvs = WebOSClient.discover()
            if not discovered_tvs:
                logger.error("لم يتم العثور على أي تلفزيون LG في الشبكة")
                return False, "لم يتم العثور على أي تلفزيون LG في الشبكة"
            
            tv_client = discovered_tvs[0]
            logger.info(f"تم العثور على تلفزيون: {tv_client.host}")
        
        # محاولة الاتصال
        tv_client.connect()
        
        # التسجيل/المصادقة
        for status in tv_client.register(tv_store):
            if status == WebOSClient.PROMPTED:
                logger.info("يرجى قبول طلب الاتصال على شاشة التلفزيون")
                return False, "يرجى قبول طلب الاتصال على شاشة التلفزيون"
            elif status == WebOSClient.REGISTERED:
                logger.info("تم التسجيل بنجاح!")
                save_store()
                return True, "تم الاتصال بنجاح"
        
        return False, "فشل في التسجيل"
        
    except Exception as e:
        logger.error(f"خطأ في الاتصال بالتلفزيون: {e}")
        return False, f"خطأ في الاتصال: {str(e)}"

def ensure_connection():
    """التأكد من وجود اتصال صالح"""
    global tv_client
    if tv_client is None:
        success, message = connect_to_tv()
        if not success:
            return False, message
    return True, "متصل"

@lg_tv_bp.route('/connect', methods=['POST'])
@cross_origin()
def connect_tv():
    """نقطة نهاية للاتصال بالتلفزيون"""
    data = request.get_json() or {}
    ip_address = data.get('ip_address')
    
    success, message = connect_to_tv(ip_address)
    
    return jsonify({
        'success': success,
        'message': message,
        'connected': success
    })

@lg_tv_bp.route('/status', methods=['GET'])
@cross_origin()
def get_status():
    """الحصول على حالة الاتصال"""
    global tv_client
    connected = tv_client is not None
    
    return jsonify({
        'connected': connected,
        'message': 'متصل' if connected else 'غير متصل'
    })

@lg_tv_bp.route('/power', methods=['POST'])
@cross_origin()
def power_toggle():
    """تشغيل/إيقاف التلفزيون"""
    connected, message = ensure_connection()
    if not connected:
        return jsonify({'success': False, 'message': message})
    
    try:
        system = SystemControl(tv_client)
        system.power_off()
        return jsonify({'success': True, 'message': 'تم إرسال أمر الطاقة'})
    except Exception as e:
        logger.error(f"خطأ في أمر الطاقة: {e}")
        return jsonify({'success': False, 'message': f'خطأ: {str(e)}'})

@lg_tv_bp.route('/volume/up', methods=['POST'])
@cross_origin()
def volume_up():
    """رفع الصوت"""
    connected, message = ensure_connection()
    if not connected:
        return jsonify({'success': False, 'message': message})
    
    try:
        media = MediaControl(tv_client)
        media.volume_up()
        return jsonify({'success': True, 'message': 'تم رفع الصوت'})
    except Exception as e:
        logger.error(f"خطأ في رفع الصوت: {e}")
        return jsonify({'success': False, 'message': f'خطأ: {str(e)}'})

@lg_tv_bp.route('/volume/down', methods=['POST'])
@cross_origin()
def volume_down():
    """خفض الصوت"""
    connected, message = ensure_connection()
    if not connected:
        return jsonify({'success': False, 'message': message})
    
    try:
        media = MediaControl(tv_client)
        media.volume_down()
        return jsonify({'success': True, 'message': 'تم خفض الصوت'})
    except Exception as e:
        logger.error(f"خطأ في خفض الصوت: {e}")
        return jsonify({'success': False, 'message': f'خطأ: {str(e)}'})

@lg_tv_bp.route('/volume/mute', methods=['POST'])
@cross_origin()
def volume_mute():
    """كتم/إلغاء كتم الصوت"""
    connected, message = ensure_connection()
    if not connected:
        return jsonify({'success': False, 'message': message})
    
    try:
        media = MediaControl(tv_client)
        # الحصول على حالة الصوت الحالية
        volume_info = media.get_volume()
        current_mute = volume_info.get('muted', False)
        media.mute(not current_mute)
        return jsonify({'success': True, 'message': 'تم تغيير حالة الكتم'})
    except Exception as e:
        logger.error(f"خطأ في كتم الصوت: {e}")
        return jsonify({'success': False, 'message': f'خطأ: {str(e)}'})

@lg_tv_bp.route('/channel/up', methods=['POST'])
@cross_origin()
def channel_up():
    """الانتقال للقناة التالية"""
    connected, message = ensure_connection()
    if not connected:
        return jsonify({'success': False, 'message': message})
    
    try:
        media = MediaControl(tv_client)
        media.channel_up()
        return jsonify({'success': True, 'message': 'تم الانتقال للقناة التالية'})
    except Exception as e:
        logger.error(f"خطأ في تغيير القناة: {e}")
        return jsonify({'success': False, 'message': f'خطأ: {str(e)}'})

@lg_tv_bp.route('/channel/down', methods=['POST'])
@cross_origin()
def channel_down():
    """الانتقال للقناة السابقة"""
    connected, message = ensure_connection()
    if not connected:
        return jsonify({'success': False, 'message': message})
    
    try:
        media = MediaControl(tv_client)
        media.channel_down()
        return jsonify({'success': True, 'message': 'تم الانتقال للقناة السابقة'})
    except Exception as e:
        logger.error(f"خطأ في تغيير القناة: {e}")
        return jsonify({'success': False, 'message': f'خطأ: {str(e)}'})

@lg_tv_bp.route('/navigate/<direction>', methods=['POST'])
@cross_origin()
def navigate(direction):
    """التنقل بالأسهم"""
    connected, message = ensure_connection()
    if not connected:
        return jsonify({'success': False, 'message': message})
    
    try:
        input_control = InputControl(tv_client)
        
        direction_map = {
            'up': input_control.up,
            'down': input_control.down,
            'left': input_control.left,
            'right': input_control.right,
            'ok': input_control.ok
        }
        
        if direction in direction_map:
            direction_map[direction]()
            return jsonify({'success': True, 'message': f'تم إرسال أمر {direction}'})
        else:
            return jsonify({'success': False, 'message': 'اتجاه غير صحيح'})
            
    except Exception as e:
        logger.error(f"خطأ في التنقل: {e}")
        return jsonify({'success': False, 'message': f'خطأ: {str(e)}'})

@lg_tv_bp.route('/number/<int:number>', methods=['POST'])
@cross_origin()
def send_number(number):
    """إرسال رقم"""
    connected, message = ensure_connection()
    if not connected:
        return jsonify({'success': False, 'message': message})
    
    try:
        input_control = InputControl(tv_client)
        
        # إرسال الرقم كنص
        for digit in str(number):
            input_control.type(digit)
        
        return jsonify({'success': True, 'message': f'تم إرسال الرقم {number}'})
    except Exception as e:
        logger.error(f"خطأ في إرسال الرقم: {e}")
        return jsonify({'success': False, 'message': f'خطأ: {str(e)}'})

@lg_tv_bp.route('/command/<command>', methods=['POST'])
@cross_origin()
def send_command(command):
    """إرسال أوامر خاصة"""
    connected, message = ensure_connection()
    if not connected:
        return jsonify({'success': False, 'message': message})
    
    try:
        input_control = InputControl(tv_client)
        
        command_map = {
            'home': input_control.home,
            'back': input_control.back,
            'settings': lambda: input_control.type('SETTINGS'),
            'list': lambda: input_control.type('LIST'),
            'more': lambda: input_control.type('MORE')
        }
        
        if command in command_map:
            command_map[command]()
            return jsonify({'success': True, 'message': f'تم إرسال أمر {command}'})
        else:
            return jsonify({'success': False, 'message': 'أمر غير معروف'})
            
    except Exception as e:
        logger.error(f"خطأ في إرسال الأمر: {e}")
        return jsonify({'success': False, 'message': f'خطأ: {str(e)}'})

@lg_tv_bp.route('/volume/info', methods=['GET'])
@cross_origin()
def get_volume_info():
    """الحصول على معلومات الصوت"""
    connected, message = ensure_connection()
    if not connected:
        return jsonify({'success': False, 'message': message})
    
    try:
        media = MediaControl(tv_client)
        volume_info = media.get_volume()
        return jsonify({
            'success': True,
            'volume': volume_info.get('volume', 0),
            'muted': volume_info.get('muted', False)
        })
    except Exception as e:
        logger.error(f"خطأ في الحصول على معلومات الصوت: {e}")
        return jsonify({'success': False, 'message': f'خطأ: {str(e)}'})

# تحميل بيانات المصادقة عند بدء التطبيق
load_store()

