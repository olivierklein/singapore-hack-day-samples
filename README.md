# Singapore Hackday Sample Code and Instructions for Intel Edison

## Prepare your intel Edison

Assemble your Intel Edison board according to https://software.intel.com/en-us/node/628221

Connect your cables: https://software.intel.com/en-us/node/628224


Log into the serial console into your Edison to find out it's assigned IP address:
```
ifconfig
```

Now SSH into your Intel Edison:
```
ssh root@<IP-address>
```

Next we want to update all the packages to the latest:

```
opkg update
opkg upgrade
```

## Install AWS CLI on Intel Edison

Login into your Intel Edison and execute the following commands on the command line:

```
wget https://bootstrap.pypa.io/get-pip.py --no-check-certificate
python get-pip.py
wget --no-check-certificate https://bootstrap.pypa.io/ez_setup.py
python ez_setup.py --insecure
opkg install man
pip install --upgrade setuptools
pip install awscli
```

Next we need to create an AWS IAM user for our Intel Edison to get our AWS access key and secret key: http://docs.aws.amazon.com/IAM/latest/UserGuide/id_users_create.html

After creating the use and having the access key, configure your AWS CLI by running the following command on the Intel Edison command line and follow the instructions. **IMPORTANT:** For region name enter `ap-southeast-1`

```
aws configure
```

Now try out the AWS CLI and see if you can list your S3 buckets:

```
aws s3 ls
```

## Webcam Setup on Intel Edison
Flip the PIN on your Intel Edison to USB Host module:

![USB Host Mode](https://software.intel.com/sites/default/files/did_feeds_images/cd3fb0c6-25c2-468f-974e-46368a26db64/cd3fb0c6-25c2-468f-974e-46368a26db64-imageId=4642a5cc-b57f-4a9a-a3bc-7f8af8dad55e.jpg)

Now plug in your USB webcam and use the serial terminal or your SSH console to see if your webcam has been successfully detected:

```
lsmod | grep uvc
```

You should see an output similar to the following:
```
root@Olis_Edison:~/test# lsmod | grep uvc
uvcvideo               71508  0
videobuf2_vmalloc      13003  1 uvcvideo
videobuf2_core         37707  1 uvcvideo
```

To grab snapshots from the camera, we need to compile and install fswebcam. Execute the following commands on your Intel Edison command line:

```
git clone https://github.com/fsphil/fswebcam.git
opkg install gd libgd3 libgd-dev
cd fswebcam
./configure --prefix=/usr
cat Makefile | sed -e 's/\-\-\<best\>//g' | tee Makefile
make
make install
```

Create an S3 bucket for your webcam snapshots and apply the following S3 bucket policy:

```json
{
  "Version":"2012-10-17",
  "Statement":[
    {
      "Sid":"AddPerm",
      "Effect":"Allow",
      "Principal": "*",
      "Action":["s3:GetObject"],
      "Resource":["arn:aws:s3:::edison-hack/*"]
    }
  ]
}
```

Now try to take a snapshot from the webcam and pipe the output into your S3 bucket:

```
fswebcam -r 1280x720 --jpeg 100 -S 13 - | aws s3 cp - s3://<your-bucket-name>/test.jpg
```

## Grove Indoor Environment Kit

Follow the instructions on the manual on how to assemble it. After that, login into your Intel edison and install the relevant Node.js module:

```
npm install mraa
```

Now you can use any of the \*.js samples provided in this repository to interact with your sensors.

## Connect the Intel Edison to AWS IoT

First create a folder to store your certificates in:
```
mkdir aws_certs
cd aws_certs
```

Generate a private key with open ssl:
```
openssl genrsa -out privateKey.pem 2048
openssl req -new -key privateKey.pem -out cert.csr
```

Fill out the fields with your info.
Run the following to activate the certificate:

```
aws iot create-certificate-from-csr --certificate-signing-request file://cert.csr --set-as-active > certOutput.txt
cat certOuput.txt
```

Run the following to save the certificate into a cert.pem file: **IMPORTANT:** Replace <certificate ID> with the ID stored in the "certificateId" field in certOutput.txt. To view the file enter: more certOutput.txt

```
aws iot describe-certificate --certificate-id <certificate ID> --output text --query certificateDescription.certificatePem  > cert.pem
```

Download the root CA:
```
curl http://www.symantec.com/content/en/us/enterprise/verisign/roots/VeriSign-Class%203-Public-Primary-Certification-Authority-G5.pem > rootCA.pem
```

Copy the following text (ctrl-c):
```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action":["iot:*"],
    "Resource": ["*"]
    }]
}
```

Enter vi policy.txt hit a and right click to paste the text

Hit ESC (escape) and type in :wq to save and quit

Now create the AWS IoT policy:
```
aws iot create-policy --policy-name PubSubToAnyTopic --policy-document file://policy.txt
```

Then attach the policy to the certificate with. **IMPORTANT**: Replace <certificate arn> with the  value stored in "certifcateArn" in the certOutput.txt file.

```
aws iot attach-principal-policy --principal <certificate arn> --policy-name "PubSubToAnyTopic"
```

Now create a thing for your Intel Edison:

```
aws iot create-thing --thing-name Intel_Edison
```

Note down the `thingArn` and register the certificate with the newly generate thing: **IMPORTANT**: Replace <certificate arn> with the  value stored in "certifcateArn" in the certOutput.txt file.

```
aws iot attach-thing-principal --thing-name Intel_Edison --principal <certificate arn>
```

Now we will use the [AWS Device SDK](https://aws.amazon.com/iot/sdk/) to connect to AWS IoT programmatically:

```
cd ~
mkdir sample
cd sample
npm install aws-iot-device-sdk
wget https://raw.githubusercontent.com/olivierklein/singapore-hack-day-samples/master/aws-iot-sample-publish.js
```

Login into the AWS IoT console and subcribe to `edison/+` topic. Then let's try it out:

```
node aws-iot-sample-publish.js
```

## A few other interesting resources

* https://software.intel.com/en-us/creating-javascript-iot-projects-with-grove-starter-kit
* https://motion-project.github.io/
* https://iotdk.intel.com/docs/master/mraa/
* https://github.com/intel-iot-devkit/upm/tree/master/examples
* https://seeeddoc.github.io/Intel-Edison_and_Grove_IoT_Starter_Kit_Powered_by_AWS/
