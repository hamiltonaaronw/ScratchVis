#version 410

#define PI		3.1415926535897932384626433832795
#define TAU		(2.0 * PI)

uniform float uFreq;
uniform float uLastFreq;
//uniform float uDeltaFreq;
uniform float uTime;
//uniform float uLastFrame;
//uniform float uDeltaTime;
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

mat2 rot(float a)
{
	return mat2(
		cos(a), sin(a),
		-sin(a), cos(a)
	);
}

float RAYS = 54.0;

float r21(vec2 v)
{
	float a = abs(sin(v.x * 1.1));
	float b = abs(cos(v.y * 104.7));
	return (a * b);
}

float distLine(vec2 p, vec2 a, vec2 b)
{
	vec2 ap = p - a;
	vec2 ab = b - a;
	float lShadow = dot(ap, ab);
	float lab = dot(ab, ab);
	float t = clamp(lShadow / lab, 0.0, 1.0);
	vec2 sp = ap - ab * t;

	return length(sp);
}

float getDist(vec2 v, vec2 p)
{
	vec2 orig = vec2(0.0);
	float d = distLine(v, orig, p);
	float w = 0.0f;
	float wz = 0.01;
	float c = smoothstep(w / RAYS, w / RAYS + wz, d);

	return c;
}

vec2 getRayPoint(float num, float len)
{
	float theta = num / RAYS * TAU;
	float x = cos(theta) * len;
	float y = sin(theta) * len;
	vec2 p = vec2(x, y);
	return p;
}

float getRayNumber(vec2 v)
{
	float theta = (atan(v.y, v.x) / TAU);
	float ray = theta * RAYS;
	return ray;
}

float getRayWheel(vec2 v, float freqOffset, float rLen, float rotate, float f)
{
	v *= rot(rotate);
	float ray = getRayNumber(v);
	float rayCenter = floor(ray);
	float freq = rayCenter + RAYS / 2.0;
	if (freq < 0.1)
		freq = RAYS;
	freq += freqOffset;
	float fft = rLen * f;

	vec2 p = getRayPoint(rayCenter, fft);
	float d = (1.0 - getDist(v, p));
	float pSize = 0.99;
	float pc = smoothstep(pSize, 1.0, 1.0 - length(v - p));
	float pcBlink = 0.5 + 0.5 * sin(uTime * 20.0 + rayCenter);
	pc *= pcBlink;

	rayCenter = ceil(ray);
	freq = rayCenter + RAYS / 2.0;
	if (freq < 0.1)
		freq = RAYS;
	freq += freqOffset;
	fft = rLen * (f * freq);
	p = getRayPoint(rayCenter, fft);
	d += (1.0 - getDist(v, p));
	float c = d * length(v);
	if ((RAYS / 2.0 - rayCenter) < 0.1)
		rayCenter = -rayCenter;
	pcBlink = 0.5 + 0.5 * sin(uTime * 20.0 + rayCenter);
	pc += smoothstep(pSize, 1.0, 1.0 - length(v - p)) * pcBlink;
	c *= r21(v);

	return 10.0 * c + 25.0 * pc;
}

vec3 hsv(float h, float s, float v)
{
	vec3 ret = ((clamp(abs(fract(h + vec3(0.0, 2.0, 1.0) / 3.0) * 9.0 - 3.0) -1.0, 0.0, 1.0) - 1.0) * s + 1.0) * v;
	return ret;
}

vec3 col(vec2 p)
{
	vec3 ret;
	vec3 c = vec3(0.0);

	p.yx *= rot(uTime) * 2.5;
	p *= cos(uTime) + (log2(sinc(uFreq)) * 100.0);

	float f = min(abs(uFreq), abs(uLastFreq)) + abs((abs(uFreq - uLastFreq)) / 2.0);
	float ff = sin(uTime + uFreq) / abs(sin(uTime - uLastFreq) / 2.0);

	p *= rot(-uTime * 0.1);
	c = 0.3 + 0.3 * vec3(sin(uTime * 0.5), sin(uTime * 0.4), sin(uTime * 0.3));
	float cf = getRayWheel(p / log2(f), 0.0, 1.0 + ff, 0.0, ff);

	float rotation = -uTime * 0.1;
	cf += 1.4 * getRayWheel(p * log2(f), 2.0 * RAYS, atan(ff, uLastFreq), rotation, f);

	rotation = -uTime * 0.2;
	cf += 1.4 * getRayWheel(p, RAYS, 0.75 * log2(f), rotation / f, atan(f, ff));
	c *= cf;

	float d = 1.0 - length(p);
	vec3 dCol = vec3(0.5, 0.5, 0.1);
	c += d * dCol;

	d = smoothstep(0.8, 1.0, 1.0 - length(p * log2(f)));
	dCol = vec3(0.5 + f);
	c += d * dCol;

	//c = vec3(1.0, 0.0, 0.0);
	//c = vec3(0.0, 1.0, 0.0);
	//c = vec3(0.0, 0.0, 1.0);

	//c *= hsv(c.b, c.r, c.g) + 0.25 + sin(uTime);

	ret = uFreq > 0.0009 ? c : vec3(0.0);

	return ret;
}

void main()
{
	vec4 ret;
	vec2 uv = (gl_FragCoord.xy - uRes) / min(uRes.x, uRes.y) * 0.25;

	ret = vec4(col(uv), 1.0);

	retColor = ret;
}