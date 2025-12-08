#!/usr/bin/env python
# _*_ coding:utf-8 _*_

from apps.utils.http_utils import HTTPX
from sanic.response import json_dumps
from config.settings import Config
import requests
import json
from jinja2 import Template
import time
from sanic.log import logger
from urllib import parse
import hmac
import base64
import hashlib
import queue
import os
import logging

# 接口频率限制
# 1000 次/分钟、50 次/秒
class Feishu:
    def __init__(self, secret=None, pc_slide=False, fail_notice=False,primary=True):
        # self.access_token = self.get_token()
        """
        机器人初始化
        :param secret: 机器人安全设置页面勾选"加签"时需要传入的密钥
        :param pc_slide: 消息链接打开方式，默认False为浏览器打开，设置为True时为PC端侧边栏打开
        :param fail_notice: 消息发送失败提醒，默认为False不提醒，开发者可以根据返回的消息发送结果自行判断和处理
        """
        self.primary = primary
        self.tenant_access_token = None  # 初始化tenant_access_token
        self.headers = {'Content-Type': 'application/json; charset=utf-8'}
        self.get_tenant_access_token(primary)  # 传入primary参数
        self.queue = queue.Queue(1000)  # 飞书官方限流每分钟发送20条信息
        self.webhook = None
        self.secret = secret
        self.pc_slide = pc_slide
        self.fail_notice = fail_notice
        self.start_time = time.time()  # 加签时，请求时间戳与请求时间不能超过1小时，用于定时更新签名
        # if self.secret is not None and self.secret.startswith('SEC'):
        #     self.update_webhook()

    def is_not_null_and_blank_str(self, content):
        """
        非空字符串
        :param content: 字符串
        :return: 非空 - True，空 - False
        """
        if content and content.strip():
            return True
        else:
            return False

    def update_webhook(self):
        """
        飞书群自定义机器人安全设置加签时，签名中的时间戳与请求时不能超过一个小时，所以每个1小时需要更新签名
        """
        timestamp = round(self.start_time * 1000)
        string_to_sign = '{}\n{}'.format(timestamp, self.secret)
        hmac_code = hmac.new(self.secret.encode(), string_to_sign.encode(), digestmod=hashlib.sha256).digest()

        quote_plus = parse.quote_plus
        sign = quote_plus(base64.b64encode(hmac_code))
        self.webhook = '{}&timestamp={}&sign={}'.format(self.webhook, str(timestamp), sign)

    def post(self, data):
        """
        发送消息（内容UTF-8编码）
        :param data: 消息数据（字典）
        :return: 返回消息发送结果
        """
        now = time.time()

        # 钉钉自定义机器人安全设置加签时，签名中的时间戳与请求时不能超过一个小时，所以每个1小时需要更新签名
        if now - self.start_time >= 3600 and self.secret is not None and self.secret.startswith('SEC'):
            self.start_time = now
            self.update_webhook()

        # 自定义机器人现在每分钟最多发送1000条消息
        self.queue.put(now)
        if self.queue.full():
            elapse_time = now - self.queue.get()
            if elapse_time < 60:
                sleep_time = int(60 - elapse_time) + 1
                time.sleep(sleep_time)

        try:
            response = requests.post(self.webhook, headers=self.headers, data=data)
        except requests.exceptions.HTTPError as exc:
            logger.error("消息发送失败， HTTP error: %d, reason: %s" % (exc.response.status_code, exc.response.reason))
            raise
        except requests.exceptions.ConnectionError:
            logger.error("消息发送失败，HTTP connection error!")
            raise
        except requests.exceptions.Timeout:
            logger.error("消息发送失败，Timeout error!")
            raise
        except requests.exceptions.RequestException:
            logger.error("消息发送失败, Request Exception!")
            raise
        else:
            try:
                result = response.json()
            except json.decoder.JSONDecodeError:
                logger.error("服务器响应异常，状态码：%s，响应内容：%s" % (response.status_code, response.text))
                return {'errcode': 500, 'errmsg': '服务器响应异常'}
            else:
                return result

    def sendGroup(self, data=None, token=None):
        '''
        飞书群通知
        '''

        self.webhook = f'https://open.feishu.cn/open-apis/bot/v2/hook/{token}'
        content = {
            "elements": [{"tag": "div", "fields": [{"is_short": False, "text": {"tag": "lark_md", "content": data}}]}]}
        content = json.dumps(content)
        payload = json.dumps({
            "card": content,
            "msg_type": "interactive"
        })
        response = self.post(data=payload)

    def get_tenant_access_token(self, primary=True):
        """
        获取tenant_access_token（企业自建应用的凭证）
        文档：https://open.feishu.cn/document/server-docs/authentication-management/access-token/tenant_access_token_internal
        """
        url = 'https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal'
        
        # 使用配置文件中的app_id和app_secret
        data = {
            "app_id": Config.FEISHU_APP_ID,
            "app_secret": Config.FEISHU_APP_SECRET
        }
        
        try:
            s = requests.session()
            s.keep_alive = False
            res = s.post(url=url, json=data)
            result = res.json()
            
            if result.get('code') == 0:
                tenant_access_token = result.get('tenant_access_token')
                self.tenant_access_token = tenant_access_token
                self.headers = {
                    'Content-Type': 'application/json',
                    'Authorization': f'Bearer {tenant_access_token}'
                }
                return tenant_access_token
            else:
                logger.error(f'❌ tenant_access_token获取失败: {result}')
                return None
        except Exception as e:
            logger.error(f'❌ tenant_access_token获取异常: {e}')
            return None

    def send_markdown(self, data, receive_id='ou_49ea22c6a3868cfe82fcd07f9cf870b4', receive_id_type='open_id'):
        self.webhook = f"https://open.feishu.cn/open-apis/im/v1/messages?receive_id_type={receive_id_type}"
        content = {"elements": [{"tag": "div","fields": [{"is_short": False,"text": {"tag": "lark_md","content": data}}]}]}
        content = json.dumps(content)
        payload = json.dumps({
            "content": content,
            "msg_type": "interactive",
            "receive_id": f"{receive_id}"
        })
        response = self.post(data=payload)

    def batch_send(self,data,user_ids=[]):
        self.webhook = 'https://open.feishu.cn/open-apis/message/v4/batch_send/'
        content = {"elements": [{"tag": "div", "fields": [{"is_short": False, "text": {"tag": "lark_md", "content": data}}]}]}
        # content = json.dumps(content)
        payload = json.dumps({
            "msg_type": "interactive",
            "card": content,
            "user_ids": user_ids
        })
        res = self.post(data=payload)

    def card_send(self):
        self.webhook = 'https://open.feishu.cn/open-apis/im/v1/messages?receive_id_type=open_id'
        content = {
            "type": "template",
            "data": {
                "template_id": "ctp_AAVPZ2QXEB8j",
                "template_variable": {
                    "article_title": "这是文章标题内容"
                }
            }
        }
        content = json.dumps(content)
        # ou_49ea22c6a3868cfe82fcd07f9cf870b4
        payload = json.dumps({
            "receive_id": "ou_49ea22c6a3868cfe82fcd07f9cf870b4",
            "msg_type": "interactive",
            "content": content
        })
        res = self.post(data=payload)
        print(res)
    def card_batch_send(self):
        self.webhook = 'https://open.feishu.cn/open-apis/message/v4/batch_send/'
        payload = json.dumps({
            "open_ids": [
                "ou_49ea22c6a3868cfe82fcd07f9cf870b4",
                "ou_49ea22c6a3868cfe82fcd07f9cf870b4"
            ],
            "msg_type": "interactive",
            "card": {
                "type": "template",
                "data": {
                    "template_id": "ctp_AAVPZ2QXEB8j",
                    "template_variable": {
                        "article_title": "这是文章标题内容"
                    }
                }
            }
        })
        res = self.post(data=payload)
        print(res)



    def get_user_open_id_by_code(self, code, user_id_type='open_id'):
        """
        OAuth 2.0 网页应用登录 - 通过code获取用户access_token和open_id
        文档：https://open.feishu.cn/document/common-capabilities/sso/api/get-access_token
        """
        # 使用OAuth 2.0 API（网页应用）
        url = "https://open.feishu.cn/open-apis/authen/v1/access_token"
        
        payload = json.dumps({
            "grant_type": "authorization_code",
            "code": code
        })
        
        headers = {
            'Content-Type': 'application/json; charset=utf-8',
            'Authorization': f'Bearer {self.tenant_access_token}'  # 使用tenant_access_token
        }
        
        primary = True
        try:
            res = requests.request("POST", url, headers=headers, data=payload)
            result = res.json()
            
            if result.get('code') == 0 and result.get('data'):
                data = result['data']
                open_id = data.get('open_id')
                access_token = data.get('access_token')  # 用户的access_token
                
                return open_id, primary
            else:
                # 如果是总公司token失败，尝试副公司
                primary = False
                self.get_tenant_access_token(primary)
                
                headers['Authorization'] = f'Bearer {self.tenant_access_token}'
                res = requests.request("POST", url, headers=headers, data=payload)
                result = res.json()
                
                if result.get('code') == 0 and result.get('data'):
                    open_id = result['data'].get('open_id')
                    return open_id, primary
                else:
                    logger.error(f'❌ OAuth登录失败: {result}')
                    return None, primary
                    
        except Exception as e:
            logger.error(f'❌ OAuth登录异常: {e}')
            return None, primary

    def get_user_info(self, user_id, user_id_type='open_id'):
        """
        获取用户详细信息
        文档：https://open.feishu.cn/document/server-docs/contact-v3/user/get
        """
        url = f'https://open.feishu.cn/open-apis/contact/v3/users/{user_id}?user_id_type={user_id_type}'
        
        try:
            res = requests.request("GET", url, headers=self.headers)
            result = res.json()
            
            if result.get('code') == 0 and result.get('data') and result['data'].get('user'):
                user = result['data']['user']
                
                user_info = {
                    "primary": self.primary,
                    "union_id": user.get('union_id'),
                    "open_id": user.get('open_id'),
                    "name": user.get('name'),
                    "avatar_72": user.get('avatar', {}).get('avatar_72', ''),
                    "email": user.get('email', ''),
                    "mobile": user.get('mobile', ''),
                    "job_title": user.get('job_title', ''),
                    "leader_user_id": user.get('leader_user_id', ''),
                    "is_tenant_manager": user.get('is_tenant_manager', False),
                    "department_ids": user.get('department_ids', [])
                }
                
                return user_info
            else:
                logger.error(f'❌ 用户信息API返回失败: {result}')
                return None
                
        except Exception as e:
            logger.error(f'❌ 获取用户信息异常: {e}')
            import traceback
            logger.error(traceback.format_exc())
            return None


    def get_user_id(self, mobiles=[], emails=[],user_id_type='user_id'):
        url = f"https://open.feishu.cn/open-apis/contact/v3/users/batch_get_id?user_id_type={user_id_type}"
        payload = json.dumps({
            "mobiles": mobiles,
            "emails": emails,
        })
        response = requests.request("POST", url, headers=self.headers, data=payload)
        print(response.json())
        us = response.json().get('data').get('user_list')
        ids = []
        for u in us:
            user_id = u.get('user_id')
            ids.append(user_id)
        return list(set(ids))


    def upload_img(self,img_url=None):
        img = Down().get_img()
        url = "https://open.feishu.cn/open-apis/im/v1/images"

        payload = {'image_type': 'message'}
        files = [
            # ('image', ('宠物性格.png', open('/xxx/宠物性格.png', 'rb'), 'application/json'))
            ('image', ('宠物性格.png', img, 'application/json'))
        ]
        headers = {
            'Authorization': 'Bearer t-g1044sdIROUEH66QWKZP4UE4QEFUJBSHLAOYPKZR'
        }

        # headers = self.headers

        response = requests.request("POST", url, headers=headers, data=payload, files=files)

        print(response.text)


class Down:
    def get_img(self,url=None):
        url = 'https://b3logfile.com/avatar/1555841253290?imageView2/1/w/128/h/128/interlace/0/q/100'
        response = requests.get(url)  # 发送GET请求
        image_data = response.content  # 获取字节流数据
        return image_data



# const
# 开放接口 URI
TENANT_ACCESS_TOKEN_URI = "/open-apis/auth/v3/tenant_access_token/internal"
JSAPI_TICKET_URI = "/open-apis/jssdk/ticket/get"


class Auth(object):
    def __init__(self, feishu_host, app_id, app_secret):
        self.feishu_host = feishu_host
        self.app_id = app_id
        self.app_secret = app_secret
        self.tenant_access_token = ""

    def get_ticket(self):
        # 获取jsapi_ticket，具体参考文档：https://open.feishu.cn/document/ukTMukTMukTM/uYTM5UjL2ETO14iNxkTN/h5_js_sdk/authorization
        self.authorize_tenant_access_token()
        url = "{}{}".format(self.feishu_host, JSAPI_TICKET_URI)
        headers = {
            "Authorization": "Bearer " + self.tenant_access_token,
            "Content-Type": "application/json",
        }
        resp = requests.post(url=url, headers=headers)
        Auth._check_error_response(resp)
        return resp.json().get("data").get("ticket", "")

    def authorize_tenant_access_token(self):
        # 获取tenant_access_token，基于开放平台能力实现，具体参考文档：https://open.feishu.cn/document/ukTMukTMukTM/ukDNz4SO0MjL5QzM/auth-v3/auth/tenant_access_token_internal
        url = "{}{}".format(self.feishu_host, TENANT_ACCESS_TOKEN_URI)
        req_body = {"app_id": self.app_id, "app_secret": self.app_secret}
        response = requests.post(url, req_body)
        Auth._check_error_response(response)
        self.tenant_access_token = response.json().get("tenant_access_token")

    @staticmethod
    def _check_error_response(resp):
        # 检查响应体是否包含错误信息
        if resp.status_code != 200:
            raise resp.raise_for_status()
        response_dict = resp.json()
        code = response_dict.get("code", -1)
        if code != 0:
            logging.error(response_dict)
            raise FeishuException(code=code, msg=response_dict.get("msg"))


class FeishuException(Exception):
    # 处理并展示飞书侧返回的错误码和错误信息
    def __init__(self, code=0, msg=None):
        self.code = code
        self.msg = msg

    def __str__(self) -> str:
        return "{}:{}".format(self.code, self.msg)

    __repr__ = __str__


if __name__ == '__main__':
#     data = '''** [新消息](https://applink.feishu.cn/client/mini_program/open?appId=cli_a539fa87b07f100d&mode=window) **
# ** 内容: **<font color='red'>55555</font>
# ** 时间: **<font color='red'>2024-02-26 16:16</font>
# ** 当前值: **<font color='red'>6% </font>'''
#     # Feishu().get_user_id_by_email(emails=['ryan.ren@intramirror.com'])
#     # Feishu().sendGroup(data)
#     # Feishu().send_markdown(data,'ou_3837491bf944d4249e5f1c6bae4dcf4b')
#     # Feishu().get_user_id_by_code('65755f6e63-88brf2dd632840b19eb8a551167622cd')
#     r=get_user_info = Feishu().get_user_info('ou_d27369f5a87956b707108fbfa5673ff3')
#     print(r)

    # r=Feishu().get_user_open_id_by_code("976p46e073334ddfa47514821259a352")
    # print(r)

    r = Feishu().get_user_id(emails=["ryan.ren@intramirror.com","jacksom.hu@intramirror.com"],user_id_type='open_id')
    print(r)
    # Feishu().card_send()
    # Feishu().card_batch_send()
    # Feishu().upload_img()

