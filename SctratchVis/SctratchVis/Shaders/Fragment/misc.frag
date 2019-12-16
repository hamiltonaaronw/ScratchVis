#version 410

#define PI		3.1415926535897932384626433832795
#define TAU		(2.0 * PI)

in vec2 oTexCoord;

uniform float uFreq;
uniform float uLastFreq;
uniform float uDeltaFreq;
uniform float uTime;
uniform float uLastFrame;
uniform float uDeltaTime;
uniform vec2 uRes;
uniform float[256] uSpectrum;

out vec4 retColor;

float sinc(float x)
{
	return sin(x) / x;
}

float cosc(float x)
{
	return cos(x) / x;
}

mat2 rot(float a)
{
	return mat2(
		cos(a), sin(a),
		-sin(a), cos(a)
	);
}

vec3 sim(vec3 p, float s)
{
	vec3 ret = p;
	ret = p + s / 2.0;
	ret = fract(ret / s) * s - s / 2.0;
	return ret;
}

vec2 rotV(vec2 p, float r)
{
	vec2 ret = vec2(
		p.x * cos(r) - p.y * sin(r),
		p.y * sin(r) + p.y * cos(r)
	);
	return ret;
}

vec2 rotsim(vec2 p, float s)
{
	vec2 ret = p;
	ret = rotV(p, -PI / (s * 2.0));
	ret = rotV(p, floor(atan(ret.x, ret.y) / PI * s) * (PI / s));

	return ret;
}

vec2 makeSymmetry(vec2 p, float t)
{
	vec2 ret = p;
	ret = rotsim(ret, sin(t * 0.3) * 2.0 + 3.0);
	ret.x = abs(ret.x);
	return ret;
}

float makePoint(float x, float y, float fx, float fy, float sx, float sy, float t)
{
	float xx = x + tan(t * fx) * sx;
	float yy = y - tan(t * fy) * sy;
	float ret = 0.5 / sqrt(abs(x * xx + yy * yy));

	return ret;
}

float hash(vec2 p, float s)
{
	vec3 p2 = vec3(p.xy, 27.0 * abs(sin(s)));
	float ret = fract(sin(dot(p2, vec3(27.1, 61.7, 12.4))) * 2.1);
	return ret;
}

float noise(vec2 p, float s)
{
	vec2 i = floor(p);
	vec2 f = fract(p);

	f *= f * (3.0 - 2.0 * f);

	float ret = mix(mix(hash(i + vec2(0.0, 0.0), s), hash(i + vec2(1.0, 0.0), s), f.x),
					mix(hash(i + vec2(0.0, 1.0), s), hash(i + vec2(1.0, 1.0), s), f.x),
					f.y) * s;

	return ret;
}

float lanczosKernel(int ai, float x)
{
	float ret;
	float af = float(ai);

	if (x == 0.0)
		return 1.0;
	if (-af <= x && x < af)
		return (af * sin(PI * x) * sin((PI * x) / af)) / ((PI * PI) * (x * x));
	else
		return 0;
}

float lanczosInterp(int ai, float x)
{
	float ret = 0.0;
	int ub = int(floor(x));
	int lb = int(floor(x)) - ai + 1;

	for (int i = lb; i <= ub; i++)
	{
		ret += uSpectrum[i] * lanczosKernel(ai, x - float(i));
		//ret = mod(abs(ret), 1.0);
	}

	return abs(ret);
}

float perlin(vec2 p, float f)
{
	mat2 m = mat2(2.0);
	float v = 0.0;
	float s = 1.0;

	for (int i = 0; i < 7; i++, s /= 2.0)
	{
		v += s * noise(p, f);
		p *= m;
	}

	return v;
} 

void makeFreqVars(out float f, out float ff, out float lkf, out float lkff, out float lif, out float liff, out float fd, out float ffd)
{
	f = min(abs(uFreq), abs(uLastFreq)) + abs(uDeltaFreq / 2.0);
	ff = fract(f * 100.0);
	lkf = lanczosKernel(2, f);
	lkff = lanczosKernel(2, ff);
	lif = lanczosInterp(3, sin(f) * 100.0 * TAU);
	liff = lanczosInterp(3, sin(ff) * 100.0 * TAU);

	fd = min(f, lif) / max(f, lif);
	fd = mod(fd, 1.0);
	ffd = max(ff, liff) / min(ff, liff);
	ffd = mod(ffd, 1.0);
}

vec3 blobs(vec2 p, float t)
{
	t *= 0.5;

	p = makeSymmetry(p, t);

	float x = p.x;
	float y = p.y;

	float a = makePoint(x,y, 3.3, 2.9, 0.3, 0.3, t);
	a += makePoint(x, y, 1.9, 2.0, 0.4, 0.4, t);
	a += makePoint(x, y, 0.8, 0.7, 0.4, 0.5, t);
	a += makePoint(x, y, 2.3, 0.1, 0.6, 0.3, t);
	a += makePoint(x, y, 0.8, 1.7, 0.5, 0.4, t);
	a += makePoint(x, y, 0.3, 1.0, 0.4, 0.4, t);
	a += makePoint(x, y, 1.4, 1.7, 0.4, 0.5, t);
	a += makePoint(x, y, 1.3, 2.1, 0.6, 0.3, t);
	a += makePoint(x, y, 1.8, 1.7, 0.5, 0.4, t);

	float b = makePoint(x, y, 1.2, 1.9, 0.3, 0.3, t);
	b += makePoint(x, y, 0.7, 2.7, 0.4, 0.4, t);
	b += makePoint(x, y, 1.4, 0.6, 0.4, 0.5, t);
	b += makePoint(x, y, 2.6, 0.4, 0.6, 0.3, t);
	b += makePoint(x, y, 0.7, 1.4, 0.5, 0.4, t);
	b += makePoint(x, y, 0.7, 1.7, 0.4, 0.4, t);
	b += makePoint(x, y, 0.8, 0.5, 0.4, 0.5, t);
	b += makePoint(x, y, 1.4, 0.9, 0.6, 0.3, t);
	b += makePoint(x, y, 0.7, 1.3, 0.5, 0.4, t);

	float c = makePoint(x, y, 3.7, 0.3, 0.3, 0.3, t);
	c += makePoint(x, y, 1.9, 1.3, 0.4, 0.4, t);
	c += makePoint(x, y, 0.8, 0.9, 0.4, 0.5, t);
	c += makePoint(x, y, 1.2, 1.7, 0.6, 0.3, t);
	c += makePoint(x, y, 0.3, 0.6, 0.5, 0.4, t);
	c += makePoint(x, y, 0.3, 0.3, 0.4, 0.4, t);
	c += makePoint(x, y, 1.4, 0.8, 0.4, 0.5, t);
	c += makePoint(x, y, 0.2, 0.6, 0.6, 0.3, t);
	c += makePoint(x, y, 1.3, 0.5, 0.5, 0.4, t);

	vec3 ret = vec3(a, b, c) / 32.0;

	return ret;
}

vec3 col(vec2 p)
{
	float f, ff, lkf, lkff, lif, liff, fd, ffd;
	makeFreqVars(f, ff, lkf, lkff, lif, liff, fd, ffd);

	float fp = perlin(p, f);
	float ffp = perlin(p, ff);

	float t = uTime + sin(fract(fp * liff) * length(p));

	float cycle = cos(t) * 0.5 + 0.5;
	float invCycle = 1.0 - cycle;

	vec2 q = p * rot(uTime);

	float r = q.x;
	float i = q.y;
	float tr = 0.0;
	float iterations = 0.0;

	int sInd = 0;

	for (int j = 0; j < 25; j++)
	{
		float sp = uSpectrum[j * 10];
		tr = r * r - i * i + cycle * q.x + invCycle * (q.x * fp);
		i = 2.0 * i * r + cycle * q.y + invCycle * (q.y * lkf);
		//i *= sp;
		r = tr;
		iterations++;

		float cond = r * r + i * i + sp * sp;
		if (cond > 4.0 + fp)
		{
			sInd = j * 10;
			break;
		}
	}
	
	vec3 c = blobs(vec2(tr + atan(fp, uSpectrum[sInd]), f / i), t * uSpectrum[sInd] + uTime);

	vec3 ret = uFreq > 0.0 ? c : vec3(0.0);

	return ret;
}

void main()
{
	vec2 uv = (gl_FragCoord.xy - uRes) / min(uRes.x, uRes.y) * 2.0;

	vec4 ret;

	ret = vec4(col(uv), 1.0);

	retColor = ret;

}