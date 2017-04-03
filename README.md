# Singapore Hackday Sample Code and Instructions for Intel Edison

## Prepare your intel Edison

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

## A few other interesting resources

* https://software.intel.com/en-us/creating-javascript-iot-projects-with-grove-starter-kit
* https://motion-project.github.io/
* https://iotdk.intel.com/docs/master/mraa/
* https://github.com/intel-iot-devkit/upm/tree/master/examples
* https://seeeddoc.github.io/Intel-Edison_and_Grove_IoT_Starter_Kit_Powered_by_AWS/
