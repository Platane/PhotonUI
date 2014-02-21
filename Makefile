gh-pages:
	cd photonui.git && git pull || git clone https://github.com/wanadev/PhotonUI.git photonui.git
	cd photonui.git && make doc
	cp -r photonui.git/photonui photonui.git/demo photonui.git/doc photonui.git/lib .
	mv demo/index.html .
	sed -i 's#\.\./##g;s#\./#demo/#g' index.html
