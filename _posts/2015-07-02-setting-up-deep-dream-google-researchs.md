---
layout: post
title: setting up Deep Dream, google research's hallucinatory work of genius
---

Google Research [wrote](http://googleresearch.blogspot.ch/2015/06/inceptionism-going-deeper-into-neural.html) recently about a technique they call "Inceptionism", which needs to be seen to be believed. Click through and check out their pictures. A full gallery of official images can be found [here](https://photos.google.com/share/AF1QipPX0SCl7OzWilt9LnuQliattX4OUCj_8EP65_cTVnBmS1jnYgsGQAieQUc1VQWdgQ?key=aVBxWjhwSzg2RjJWLWRuVFBBZEN1d205bUdEMnhB). The techniques used to generate these sorts of images were described in broad strokes in this blog post, but the level of detail stopped just short of what someone wanting to replicate their results might have wanted.

That is, [until they published their source code](https://github.com/google/deepdream).

In this repo (which was created just this morning, as of this post's writing) is an IPython notebook which contains everything necessary to duplicate the results you see in their blog post. That's so cool that it's honestly a little hard to believe. The dependencies are detailed in the repo. There are surprisingly few of them, and they're all surprisingly easy to get set up. Let me walk you through what I had to do on my Debian Stretch system to get everything up and running.

NumPy, SciPy, PIL, and IPython top the list of dependencies. These are all libraries that the savvy Pythonista likely already has installed. Anyone without them should hasten to change this state of affairs. If you have Python's library manager, pip, installed -- and you should -- then the best way to install all these libraries is by invoking,

`sudo pip install numpy scipy Pillow ipython`
    
You're also going to need `protobuf`. This is a Google library, and should be available through your package manager. On Debian,

`sudo apt-get install protobuf-compiler`

did the trick for me.

That takes care of the easy dependencies. Next, we have to install Caffe. This is where I spent most of my time. It turns out that the painless way to handle this whole process is as follows.

First off, get Caffe's own prerequisites out of the way. I used the list of `apt-get` packages from their [Ubuntu](http://caffe.berkeleyvision.org/install_apt.html) install reference. To wit:

`sudo apt-get install libprotobuf-dev libleveldb-dev libsnappy-dev libopencv-dev libboost-all-dev libhdf5-serial-dev libgflags-dev libgoogle-glog-dev liblmdb-dev protobuf-compiler libatlas-base-dev`

I've had smooth sailing just installing that list. As ever, YMMV. If anyone finds that they need to install other packages in addition to these, please let me know and I'll amend the list.

Anyhow, once that's taken care of, `cd` to whatever directory you want to install Caffe in (I put it in my usual `~/workspace` directory), then download the Git repo and configure whatever options you'd like. There are several ways to get the Git repo. First, make sure to [set up Git](https://help.github.com/articles/set-up-git/), and follow the instructions on that page for either connecting over HTTPS or SSH. Then, depending on which of those you set up, run _one of the two following commands_. If you set up HTTPS, use

`git clone https://github.com/BVLC/caffe.git`

to clone over HTTPS, or if you set up SSH, then

`git clone git@github.com:BVLC/caffe.git`

to clone the repo that way. Once you've run one of these commands, which will create a new "caffe" folder in the current working directory, do the following:

`cd caffe`

`cp Makefile.config{.example,}`

Then, open `Makefile.config` in your favorite editor and change config parameters as needed. Make sure you already have CUDA set up, and if you're going to uncomment the cuDNN line, make sure you have that installed too, of course. Now, to actually build this monstrosity...

`mkdir build`

`cd build`

`cmake ..`

`make pycaffe`

`make runtest`

All of these will produce a fair bit of output, especially the last two. The last one runs tests. This is not actually _necessary_, but it is highly recommended as a way to make sure everything's gone right. Hopefully all the output produced by these commands is encouraging. If it isn't, you have a problem -- likely have an unmet dependency -- to troubleshoot. As a first step in troubleshooting, you could try running the above `pip` and `apt-get` commands again (possibly with `--upgrade` in the case of `pip`) just in case you missed anything. Past that, it's all up to you. Google your error message along with "Caffe" and you can likely find some documentation on what to do.

If you managed not to hit any errors, you're now out of the woods! The hard part is over. The last step is to put Caffe in your PYTHONPATH so you can import it. I just did this the quick-and-dirty way, by putting

`export PYTHONPATH=/home/fish/workspace/caffe/python:$PYTHONPATH`

at the end of my .bashrc file. Obviously, you're going to want to change the path to reflect wherever you cloned Caffe into.

Now, restart your shell or `source ~/.bashrc` and you're set! You now have all your dependencies taken care of and can follow along with the IPython notebook in the deepdream repo linked at the top of this post.

Well -- almost. Your Caffe install comes with the skeletons necessary to use a few different models out of the box, but the trained models themselves aren't included with the repo because they're so large. You'll have to download them individually. To get the model used in the notebook, navigate to your Caffe install dir, then

`cd models/bvlc_googlenet/`

`wget http://dl.caffe.berkeleyvision.org/bvlc_googlenet.caffemodel`

This link is unlikely to change any time soon, but if it does, you can expect to find an updated link in the directory's `readme.md` file. Once `wget` finishes up, you'll have the model you need to work through the example. If you want to see the images as you work (and you probably do) then you can't run IPython this on the command line, though -- you have to start up its fancy Qt GUI console (which I didn't even know about until today). You can get this by running, `ipython qtconsole` and then you're ready to [follow along](https://github.com/google/deepdream/blob/master/dream.ipynb)!

Note, by the way, that if you took the bold route and compiled Caffe with GPU support, and if you have a compatible GPU, then you can run `caffe.set_mode_gpu()` right away before dreaming, and it'll likely speed the process up by several orders of magnitude. There is an open pull request to integrate information on this into the Google notebook; you can find the pull request [here](https://github.com/google/deepdream/pull/15). It has some discussion on the topic.

I'm having a whole lot of fun with this. Expect a follow-up post in the next few days with a bunch of cool pictures, and possibly some variations on the theme.
