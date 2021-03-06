#include "ShaderManager.h"

ShaderManager::ShaderManager()
{
	init();
}

void ShaderManager::addShader(ShaderProgram p, ShaderInfo *s)
{
	std::ifstream fV(s->mVertPath),
		fF(s->mFragPath);

	std::string badPath = "";

	if (!fV.good())
	{
		std::cout << "Failed to load shader program " << s->mName
			<< std::endl << "Filepath " << s->mVertPath << " is invalid\n";
		return;
	}
	if (!fF.good())
	{
		std::cout << "Failed to load shader program " << s->mName
			<< std::endl << "Filepath " << s->mFragPath << " is invalid\n";
		return;
	}
	if (s->mGeomPath != NULL)
	{
		std::ifstream fG(s->mGeomPath);
		if (!fG.good())
		{
			std::cout << "Failed to load shader program " << s->mName
				<< std::endl << "Filepath " << s->mGeomPath << " is invalid\n";
			return;
		}
	}
	mShaders.insert(std::pair<ShaderProgram, ShaderInfo*>(p, s));
}

void ShaderManager::clean()
{
	for (auto it = mShaders.begin(); it != mShaders.end(); it++)
	{
		it->second = NULL;
		delete it->second;
	}
	mShaders.clear();
}

void ShaderManager::init()
{
	this->addShader(ShaderProgram::PSYCH,				new ShaderInfo("Psychedelicious",	0,	0,	0, "Shaders/Vertex/basic.vert",	"Shaders/Fragment/tunnel.frag",			NULL));
	this->addShader(ShaderProgram::BLOSSOM,				new ShaderInfo("Blossom",			0,	0,	0, "Shaders/Vertex/basic.vert",	"Shaders/Fragment/blossom.frag",		NULL));
	this->addShader(ShaderProgram::MOONS,				new ShaderInfo("Moons",				0,	0,	0, "Shaders/Vertex/basic.vert",	"Shaders/Fragment/moons.frag",			NULL));
	this->addShader(ShaderProgram::CUBES,					new ShaderInfo("Cubes",			0,	0,	0, "Shaders/Vertex/basic.vert",	"Shaders/Fragment/cubes.frag",			NULL));
	this->addShader(ShaderProgram::LIGHTS,				new ShaderInfo("Lightshow",			0,	0,	0, "Shaders/Vertex/basic.vert",	"Shaders/Fragment/lightshow.frag",		NULL));
	this->addShader(ShaderProgram::FRACTID,				new ShaderInfo("Fractid",			0,	0,	0, "Shaders/Vertex/basic.vert",	"Shaders/Fragment/fractid.frag",		NULL));
	this->addShader(ShaderProgram::SMOKE,				new ShaderInfo("Smoke",				0,	0,	0, "Shaders/Vertex/basic.vert",	"Shaders/Fragment/smoke.frag",			NULL));
	this->addShader(ShaderProgram::FLOWER,				new ShaderInfo("Flowers",			0,	0,	0, "Shaders/Vertex/basic.vert",	"Shaders/Fragment/flowers.frag",		NULL));
	this->addShader(ShaderProgram::LIGHTNING,			new ShaderInfo("Lightning",			0,	0,	0, "Shaders/Vertex/basic.vert",	"Shaders/Fragment/lightning.frag",		NULL));
	this->addShader(ShaderProgram::PINNEAL,				new ShaderInfo("Pinneal",			0,	0,	0, "Shaders/Vertex/basic.vert",	"Shaders/Fragment/pinneal.frag",		NULL));
	this->addShader(ShaderProgram::SPACE_STATION,		new ShaderInfo("Space Station",		0,	0,	0, "Shaders/Vertex/basic.vert",	"Shaders/Fragment/space.frag",			NULL));
	this->addShader(ShaderProgram::TAPESTRY,			new ShaderInfo("Tapestry",			0,	0,	0, "Shaders/Vertex/basic.vert",	"Shaders/Fragment/tapestry.frag",		NULL));
	this->addShader(ShaderProgram::INFINITE,			new ShaderInfo("Infinity",			0,	0,	0, "Shaders/Vertex/basic.vert",	"Shaders/Fragment/infinity.frag",		NULL));
	this->addShader(ShaderProgram::PILLARS,				new ShaderInfo("Pillars",			0,	0,	0, "Shaders/Vertex/basic.vert",	"Shaders/Fragment/pillars.frag",		NULL));
	this->addShader(ShaderProgram::TRIANGLES,			new ShaderInfo("Triangles",			0,	0,	0, "Shaders/Vertex/basic.vert",	"Shaders/Fragment/triangles.frag",		NULL));
	this->addShader(ShaderProgram::STATIC,				new ShaderInfo("Static",			0,	0,	0, "Shaders/Vertex/basic.vert",	"Shaders/Fragment/static.frag",			NULL));
	this->addShader(ShaderProgram::SQUIGGLES,			new ShaderInfo("Squiggles",			0,	0,	0, "Shaders/Vertex/basic.vert",	"Shaders/Fragment/squiggles.frag",		NULL));
	this->addShader(ShaderProgram::ZAP,					new ShaderInfo("Zap",				0,	0,	0, "Shaders/Vertex/basic.vert", "Shaders/Fragment/zap.frag",			NULL));
	this->addShader(ShaderProgram::HEX,					new ShaderInfo("Hex",				0,	0,	0, "Shaders/Vertex/basic.vert", "Shaders/Fragment/hex.frag",			NULL));
	this->addShader(ShaderProgram::FRACTAL,				new ShaderInfo("Fractal",			0,  0,  0, "Shaders/Vertex/basic.vert", "Shaders/Fragment/fractal.frag",		NULL));
	this->addShader(ShaderProgram::FRACTAL_2,			new ShaderInfo("Fractal_2",			0,	0,	0, "Shaders/Vertex/basic.vert", "Shaders/Fragment/fract2.frag",			NULL));
	//this->addShader(ShaderProgram::MISC,				new ShaderInfo("Misc",				0,	0,	0, "Shaders/Vertex/basic.vert", "Shaders/Fragment/misc.frag",			NULL));

	this->setNumShaders(mShaders.size());
	this->setCurProg(mShaders.begin()->first);
}

void ShaderManager::reloadShader()
{
	this->toggleShader(0);
}

void ShaderManager::toggleShader(int prevNext)
{
	int i = 0 + (int)mCurProg + prevNext;

	int cProg = (i < 0) ? mShaders.size() - 1 : i % mShaders.size();
	this->setCurProg((ShaderProgram)cProg);

	ShaderInfo *pTmp = mShaders.find(mCurProg)->second;

	if (mpCurShader)
		glDeleteProgram(mpCurShader->getID());

	this->unloadCurShader();

	mpCurShader = new Shader(pTmp->mName, pTmp->mVID, pTmp->mFID, pTmp->mGID, pTmp->mVertPath, pTmp->mFragPath, pTmp->mGeomPath);
}

void ShaderManager::unloadCurShader()
{
	mpCurShader = NULL;
	delete mpCurShader;
}

void ShaderManager::use()
{
	if (!mpCurShader)
		toggleShader(0);

	mpCurShader->use();
}

ShaderManager::~ShaderManager()
{
	clean();
}