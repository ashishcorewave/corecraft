var FCM = require('fcm-node');
var serverKey = 'AAAAMpJh22U:APA91bFZ1Gvyvqh94TtQ-zVfxHYT6cXubtubcuuZcA1MAlVMnG7Jr0rycmfQhTcVyM-_lV5MBcy1RsHT_bEgIsRk5HahRqsvf9NRf9PuaMcQw2EEh4c2PJe5XRQQCB0BZYgdof-to3ss'; //put your server key here
var fcm = new FCM(serverKey);

const sendNotification = (token, title, body, image = null, data = null, device_type = '2') => {
    return new Promise(async resolve => {
        if (token && title) {
            // console.log('token,title', token, title);
            let message = {
                to: token,
                sound : "default"
            }
            if (device_type == '1') {
                message.data = {
                    title: title,
                    body: body,
                    click_action: "FLUTTER_NOTIFICATION_CLICK"
                }
            } else {
                message.notification = { //notification object
                    title: title,
                    body: body
                }
            }
            if (data) {
                if (message.data) {
                    Object.assign(message.data, data)
                } else {
                    message.data = data
                }
                // message['data'] = data
            } if (image) {
                if (device_type == '1') {
                    message.data['image'] = image
                } else {
                    message.notification['image'] = image
                }
                message['android'] = {
                    data: {
                        imageUrl: image
                    }
                }
                message['apns'] = {
                    payload: {
                        aps: {
                            'mutable-content': 1
                        }
                    },
                    fcm_options: {
                        image: image
                    }
                }
                message['webpush'] = {
                    headers: {
                        image: image
                    }
                }
            }
            // console.log('message', message);
            fcm.send(message, function (err, response) {
                if (err) {
                    console.log('err', err);
                    resolve({ status: 0, message: "Failed to send notification", err: err });
                } else {
                    // console.log("Successfully sent with response: ", response);
                    resolve({ status: 1, data: response, message: "Notification sent" })
                }
            });
        } else {
            resolve({ status: 0, message: "Enter all details" });
        }

    })
}

module.exports = { sendNotification };